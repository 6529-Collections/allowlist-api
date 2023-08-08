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
import { assertUnreachable } from '../app.utils';
import { Alchemy } from 'alchemy-sdk';

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

  async start(tokenPoolId: string): Promise<{
    continue: boolean;
    entity: TokenPoolDownloadEntity;
  }> {
    const entity = await this.claimEntity(tokenPoolId);
    if (!entity) {
      this.logger.error(
        `Nothing to claim. Claimable tokenpool download with id ${tokenPoolId} not found`,
      );
      return;
    }
    this.logger.log(
      `Claimed tokenpool download with id ${tokenPoolId}. Starting...`,
    );
    let doableThroughAlchemy: boolean;
    try {
      await this.alchemy.nft.getOwnersForContract(entity.contract, {
        withTokenBalances: true,
        block: entity.block_no.toString(),
      });
      doableThroughAlchemy = true;
    } catch (e) {
      doableThroughAlchemy = false;
    }
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
    this.logger.log(`Batch type latest block is ${batchTypeLatestBlock}`);

    if (doableThroughAlchemy) {
      return this.runOperationsAndFinishUp(entity, tokenPoolId);
    } else {
      throw new Error('Not implemented');
      // const schema =
      //   await this.allowlistCreator.etherscanService.getContractSchema({
      //     contractAddress: entity.contract,
      //   });
      // switch (schema) {
      //   case ContractSchema.ERC721:
      //     return this.doTransferType(
      //       entity,
      //       schema,
      //       singleTypeLatestBlock,
      //       'single',
      //     ).then((job) => {
      //       if (job.continue) {
      //         return job;
      //       }
      //       return this.runOperationsAndFinishUp(entity, tokenPoolId);
      //     });
      //   case ContractSchema.ERC721Old:
      //     return this.doTransferType(
      //       entity,
      //       schema,
      //       singleTypeLatestBlock,
      //       'single',
      //     ).then((job) => {
      //       if (job.continue) {
      //         return job;
      //       }
      //       return this.runOperationsAndFinishUp(entity, tokenPoolId);
      //     });
      //   case ContractSchema.ERC1155:
      //     return this.doTransferType(
      //       entity,
      //       schema,
      //       batchTypeLatestBlock,
      //       'batch',
      //     )
      //       .then((job) => {
      //         if (job.continue) {
      //           return job;
      //         }
      //         return this.doTransferType(
      //           entity,
      //           schema,
      //           singleTypeLatestBlock,
      //           'single',
      //         );
      //       })
      //       .then((job) => {
      //         if (job.continue) {
      //           return job;
      //         }
      //         return this.runOperationsAndFinishUp(entity, tokenPoolId);
      //       });
      //   default:
      //     assertUnreachable(schema);
      //     break;
      // }
    }
  }

  private async doTransferType(
    entity: TokenPoolDownloadEntity,
    schema: ContractSchema,
    latestBlockNo: number,
    transferType: 'single' | 'batch',
  ) {
    const start = Time.now();
    for await (const transfers of this.allowlistCreator.etherscanService.getTransfers(
      {
        contractAddress: entity.contract,
        contractSchema: schema,
        startingBlock: latestBlockNo.toString(),
        toBlock: entity.block_no.toString(),
        transferType: transferType,
      },
    )) {
      await this.transferRepository.saveContractTransfers(
        entity.contract,
        transfers,
      );
      if (this.isTimeUp(start)) {
        this.logger.log(
          `Exceeded the 5 minute timeout. Marking as in progress and rescheduling...`,
        );
        return { continue: true, entity };
      }
    }
    return { continue: false, entity };
  }

  private isTimeUp(start: Time) {
    return start.diffFromNow().gt(Time.minutes(5));
  }

  private async runOperationsAndFinishUp(
    entity: TokenPoolDownloadEntity,
    tokenPoolId: string,
  ): Promise<{ continue: boolean; entity: TokenPoolDownloadEntity }> {
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
        return { continue: false, entity };
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
    }
    return { continue: false, entity };
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
