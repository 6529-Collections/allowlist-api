import { Inject, Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class TokenPoolDownloaderService {
  private readonly logger = new Logger(TokenPoolDownloaderService.name);

  constructor(
    private readonly tokenPoolDownloadRepository: TokenPoolDownloadRepository,
    private readonly tokenPoolTokenRepository: TokenPoolTokenRepository,
    @Inject(AllowlistCreator.name)
    private readonly allowlistCreator: AllowlistCreator,
    private readonly db: DB,
  ) {}

  async prepare({
    contract,
    tokenIds,
    tokenPoolId,
    allowlistId,
    blockNo,
  }: {
    readonly contract: string;
    readonly tokenIds?: string;
    readonly tokenPoolId: string;
    readonly allowlistId: string;
    readonly blockNo: number;
  }) {
    await this.tokenPoolDownloadRepository.save({
      contract,
      token_ids: tokenIds,
      token_pool_id: tokenPoolId,
      allowlist_id: allowlistId,
      block_no: blockNo,
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

  async start(tokenPoolId: string) {
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
    };
    try {
      const allowlistState = await this.allowlistCreator.execute([
        {
          code: AllowlistOperationCode.CREATE_ALLOWLIST,
          params: allowlistOpParams,
        },
        {
          code: AllowlistOperationCode.CREATE_TOKEN_POOL,
          params: tokenPoolOpParams,
        },
      ]);
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
        const key = `${tokenPoolId}_${owner}_${id}_${contract}`;
        if (acc[key]) {
          acc[key] = { ...acc[key], amount: acc[key].amount + 1 };
        } else {
          acc[key] = {
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
    await this.tokenPoolTokenRepository.upsert(entities, { connection });
  }
}
