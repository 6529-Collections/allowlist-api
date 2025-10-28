import { Injectable, Logger } from '@nestjs/common';
import { TokenPoolDownloadRepository } from '../repository/token-pool-download/token-pool-download.repository';
import { TokenPoolDownloadStatus } from '../repository/token-pool-download/token-pool-download-status';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { randomUUID } from 'crypto';
import { TokenPoolParams } from '@6529-collections/allowlist-lib/allowlist/state-types/token-pool';
import { DescribableEntity } from '@6529-collections/allowlist-lib/allowlist/state-types/describable-entity';
import { DB } from '../repository/db';
import { TokenPoolDownloadEntity } from '../repository/token-pool-download/token-pool-download.entity';
import { TokenOwnership } from '@6529-collections/allowlist-lib/allowlist/state-types/token-ownership';
import { Connection } from 'mariadb';
import { TokenPoolTokenEntity } from '../repository/token-pool-token/token-pool-token.entity';
import { TokenPoolTokenRepository } from '../repository/token-pool-token/token-pool-token.repository';
import { sha256 } from 'js-sha256';
import { AllowlistState } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-state';
import { TransferRepository } from '../repository/transfer/transfer.repository';
import { ContractSchema } from '@6529-collections/allowlist-lib/app-types';
import { Time } from '../time';
import { Alchemy } from 'alchemy-sdk';
import {
  TokenPoolDownloaderParams,
  TokenPoolDownloaderParamsState,
} from './token-pool.types';

@Injectable()
export class TokenPoolDownloaderService {
  private readonly logger = new Logger(TokenPoolDownloaderService.name);

  constructor(
    private readonly tokenPoolDownloadRepository: TokenPoolDownloadRepository,
    private readonly tokenPoolTokenRepository: TokenPoolTokenRepository,
    private readonly allowlistCreator: AllowlistCreator,
    private readonly transferRepository: TransferRepository,
    private readonly alchemy: Alchemy,
    private readonly db: DB,
  ) {}

  async prepare({
    contract,
    tokenIds,
    tokenPoolId,
    allowlistId,
    blockNo,
    consolidateBlockNo,
  }: {
    readonly contract: string;
    readonly tokenIds?: string;
    readonly tokenPoolId: string;
    readonly allowlistId: string;
    readonly blockNo: number;
    readonly consolidateBlockNo: number | null;
  }) {
    await this.tokenPoolDownloadRepository.delete(tokenPoolId);
    await this.tokenPoolDownloadRepository.save({
      contract,
      token_ids: tokenIds,
      token_pool_id: tokenPoolId,
      allowlist_id: allowlistId,
      block_no: blockNo,
      consolidate_block_no: consolidateBlockNo ?? null,
      status: TokenPoolDownloadStatus.PENDING,
    });
  }

  private async claimEntity(
    tokenPoolId: string,
  ): Promise<TokenPoolDownloadEntity | null> {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const entity = await this.tokenPoolDownloadRepository.claim(tokenPoolId);
      await connection.commit();
      return entity;
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      await connection.end();
    }
  }

  async start({ config, state }: TokenPoolDownloaderParams): Promise<{
    continue: boolean;
    entity: TokenPoolDownloadEntity;
    state: TokenPoolDownloaderParamsState;
    error?: string;
  }> {
    const { tokenPoolId } = config;
    const entity = await this.claimEntity(tokenPoolId);
    if (!entity) {
      this.logger.warn(
        `Nothing to claim. Claimable tokenpool download with id ${tokenPoolId} not found`,
      );
      return { continue: false, entity: null, state };
    }
    const { startingBlocks } = state;
    this.logger.log(
      `Claimed tokenpool download with id ${tokenPoolId}. Starting...`,
    );
    const doableThroughAlchemy = await this.attemptThroughAlchemy(entity);
    this.logger.log(`Asking for single type latest block...`);
    const singleTypeLatestBlock =
      await this.transferRepository.getLatestTransferBlockNo({
        contract: entity.contract,
        transferType: 'single',
      });
    this.logger.log(`Single type latest block is ${singleTypeLatestBlock}`);

    this.logger.log(`Asking for batch type latest block...`);
    const batchTypeLatestBlock =
      await this.transferRepository.getLatestTransferBlockNo({
        contract: entity.contract,
        transferType: 'batch',
      });
    if (
      !!startingBlocks.length &&
      startingBlocks.at(-1)?.single === singleTypeLatestBlock &&
      startingBlocks.at(-1)?.batch === batchTypeLatestBlock
    ) {
      this.logger.log(`Already processed this block. Erroring...`);
      await this.tokenPoolDownloadRepository.changeStatusToError({
        tokenPoolId,
      });
      return {
        continue: false,
        entity,
        state,
        error: `Tried to reprocess already processed block for contract ${entity.contract}`,
      };
    }

    this.logger.log(`Old single type block: ${startingBlocks.at(-1)?.single}`);
    this.logger.log(`New single type block: ${singleTypeLatestBlock}`);
    this.logger.log(`Old batch type block: ${startingBlocks.at(-1)?.batch}`);
    this.logger.log(`New batch type block: ${batchTypeLatestBlock}`);

    startingBlocks.push({
      single: singleTypeLatestBlock,
      batch: batchTypeLatestBlock,
    });

    this.logger.log(`Batch type latest block is ${batchTypeLatestBlock}`);
    this.logger.log(
      `Starting to index with${doableThroughAlchemy ? `` : `out`} Alchemy`,
    );
    if (doableThroughAlchemy) {
      return this.runOperationsAndFinishUp({ entity, state });
    } else {
      return await this.doWithoutAlchemy(
        entity,
        singleTypeLatestBlock,
        state,
        batchTypeLatestBlock,
      );
    }
  }

  private async doWithoutAlchemy(
    entity: TokenPoolDownloadEntity,
    singleTypeLatestBlock: number,
    state: TokenPoolDownloaderParamsState,
    batchTypeLatestBlock: number,
  ) {
    const schema =
      await this.allowlistCreator.etherscanService.getContractSchema({
        contractAddress: entity.contract,
      });
    this.logger.log(`${entity.contract} schema: ${schema}`);
    if ([ContractSchema.ERC721, ContractSchema.ERC721Old].includes(schema)) {
      return this.doTransferTypeSingle(
        entity,
        schema,
        singleTypeLatestBlock,
        state,
      );
    } else if (schema === ContractSchema.ERC1155) {
      return this.doTransferTypeBatch(
        entity,
        schema,
        batchTypeLatestBlock,
        singleTypeLatestBlock,
        state,
      );
    }
    throw new Error("Didn't expect to get here");
  }

  private doTransferTypeBatch(
    entity: TokenPoolDownloadEntity,
    schema,
    batchTypeLatestBlock: number,
    singleTypeLatestBlock: number,
    state: TokenPoolDownloaderParamsState,
  ) {
    return this.doTransferType({
      entity,
      schema,
      latestBlockNo: batchTypeLatestBlock,
      transferType: 'batch',
      state,
    })
      .then((job) => {
        if (job.continue) {
          return job;
        }
        return this.doTransferTypeSingle(
          entity,
          schema,
          singleTypeLatestBlock,
          state,
          true,
        );
      })
      .then((job) => {
        if (job.continue) {
          return job;
        }
        return this.runOperationsAndFinishUp({ entity, state });
      });
  }

  private doTransferTypeSingle(
    entity: TokenPoolDownloadEntity,
    schema,
    singleTypeLatestBlock: number,
    state: TokenPoolDownloaderParamsState,
    skipFinishUp = false,
  ) {
    return this.doTransferType({
      entity,
      schema,
      latestBlockNo: singleTypeLatestBlock,
      transferType: 'single',
      state,
    }).then((job) => {
      if (job.continue || skipFinishUp) {
        return job;
      }
      return this.runOperationsAndFinishUp({ entity, state });
    });
  }

  private async attemptThroughAlchemy(entity: TokenPoolDownloadEntity) {
    try {
      await this.alchemy.nft.getOwnersForContract(entity.contract, {
        withTokenBalances: true,
        block: entity.block_no.toString(),
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  private async doTransferType({
    entity,
    schema,
    latestBlockNo,
    transferType,
    state,
  }: {
    entity: TokenPoolDownloadEntity;
    schema: ContractSchema;
    latestBlockNo: number;
    transferType: 'single' | 'batch';
    state: TokenPoolDownloaderParamsState;
  }): Promise<{
    continue: boolean;
    entity: TokenPoolDownloadEntity;
    state: TokenPoolDownloaderParamsState;
  }> {
    const start = Time.now();
    const params = {
      contractAddress: entity.contract,
      contractSchema: schema,
      startingBlock: latestBlockNo.toString(),
      toBlock: entity.block_no.toString(),
      transferType: transferType,
    };
    this.logger.log(
      `Starting fetch transfers through etherscan ${JSON.stringify(params)}`,
    );
    for await (const transfers of this.allowlistCreator.etherscanService.getTransfers(
      params,
    )) {
      this.logger.log(
        `Got ${transfers.length} transfers. ${JSON.stringify(params)}`,
      );
      await this.transferRepository.saveContractTransfers(
        entity.contract,
        transfers,
      );
      if (this.isTimeUp(start)) {
        this.logger.log(
          `Exceeded the 5 minute timeout. Marking as in progress and rescheduling...`,
        );
        return { continue: true, entity, state };
      }
    }
    return { continue: false, entity, state };
  }

  private isTimeUp(start: Time) {
    return start.diffFromNow().gt(Time.minutes(5));
  }

  private async runOperationsAndFinishUp({
    entity,
    state,
  }: {
    entity: TokenPoolDownloadEntity;
    state: TokenPoolDownloaderParamsState;
  }): Promise<{
    continue: boolean;
    entity: TokenPoolDownloadEntity;
    state: TokenPoolDownloaderParamsState;
    error?: string;
  }> {
    const { token_pool_id: tokenPoolId } = entity;
    this.logger.log(
      `Running operations and finishing up for tokenpool ${tokenPoolId}`,
    );
    const mockAllowlistId = randomUUID();
    const mockPoolId = randomUUID();
    const allowlistOpParams: DescribableEntity = {
      id: mockAllowlistId,
      name: mockAllowlistId,
      description: mockAllowlistId,
    };
    const tokenPoolOpParams: TokenPoolParams = {
      id: mockPoolId,
      name: mockPoolId,
      description: mockPoolId,
      contract: entity.contract,
      tokenIds: entity.token_ids,
      blockNo: entity.block_no,
      consolidateBlockNo: entity.consolidate_block_no,
    };
    let allowlistState: AllowlistState;
    try {
      allowlistState = await this.allowlistCreator.execute([
        {
          code: AllowlistOperationCode.CREATE_ALLOWLIST,
          params: allowlistOpParams,
        },
        {
          code: AllowlistOperationCode.CREATE_TOKEN_POOL,
          params: tokenPoolOpParams,
        },
      ]);
    } catch (e) {
      console.error(`Persisting state for token pool ${tokenPoolId} failed`, e);
      await this.tokenPoolDownloadRepository.changeStatusToError({
        tokenPoolId,
      });
      throw e;
    }
    try {
      const con = await this.db.getConnection();
      this.logger.log(
        `Running operations and finishing up for tokenpool ${tokenPoolId}`,
      );
      try {
        await con.beginTransaction();
        await this.persistTokenOwnerships({
          ownerships: Object.values(allowlistState.tokenPools).flatMap(
            (tokenPool) =>
              tokenPool.tokens.map((token) => ({
                ownership: token,
                tokenPoolId: entity.token_pool_id,
              })),
          ),
          allowlistId: entity.allowlist_id,
          connection: con,
        });
        await this.tokenPoolDownloadRepository.changeStatusToCompleted({
          tokenPoolId,
          connection: con,
        });
        await con.commit();
        this.logger.log(`Finished tokenpool download with id ${tokenPoolId}.`);
        return { continue: false, entity, state };
      } catch (e) {
        await con.rollback();
        throw e;
      } finally {
        await con.end();
      }
    } catch (e) {
      console.error(`Persisting state for token pool ${tokenPoolId} failed`, e);
      await this.tokenPoolDownloadRepository.changeStatusToError({
        tokenPoolId,
      });
      return {
        continue: false,
        entity,
        state,
        error: `Persisting state for token pool ${tokenPoolId} failed: ${e.message}`,
      };
    }
  }

  private async persistTokenOwnerships({
    ownerships,
    allowlistId,
    connection,
  }: {
    ownerships: { ownership: TokenOwnership; tokenPoolId: string }[];
    allowlistId: string;
    connection: Connection;
  }) {
    const entities = Object.values(
      ownerships.reduce((acc, ownership) => {
        const tokenPoolId = ownership.tokenPoolId;
        const { id, contract, owner } = ownership.ownership;
        const key = sha256(
          `${tokenPoolId}_${owner}_${allowlistId}_${id}_${contract}`,
        );
        if (acc[key]) {
          acc[key] = { ...acc[key], amount: acc[key].amount + 1 };
        } else {
          acc[key] = {
            id: key,
            allowlist_id: allowlistId,
            token_pool_id: tokenPoolId,
            token_id: id,
            amount: 1,
            wallet: owner,
            contract,
          };
        }
        return acc;
      }, {} as Record<string, TokenPoolTokenEntity>),
    );
    await this.tokenPoolTokenRepository.insert(entities, { connection });
  }
}
