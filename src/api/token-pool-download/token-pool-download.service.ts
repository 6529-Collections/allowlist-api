import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TokenPoolDownloadEntity } from '../../repository/token-pool-download/token-pool-download.entity';
import { TokenPoolDownloadResponseApiModel } from './model/token-pool-download-response-api.model';
import { TokenPoolDownloadRepository } from '../../repository/token-pool-download/token-pool-download.repository';
import { PhaseComponentWinnerRepository } from '../../repository/phase-component-winner/phase-component-winner.repository';
import { TokenPoolTokenRepository } from '../../repository/token-pool-token/token-pool-token.repository';
import { TokenPoolDownloadTokenPoolUniqueWalletsCountRequestApiModel } from './model/token-pool-download-token-pool-unique-wallets-count-request-api.model';
import { Pool } from '@6529-collections/allowlist-lib/app-types';
import { TokenPoolDownloadTokenResponseApiModel } from './model/token-pool-download-token-response-api.model';
import { TokenPoolDownloadStatus } from '../../repository/token-pool-download/token-pool-download-status';
import { bigInt2Number } from '../../app.utils';
import { Time } from '../../time';
import { AllowlistOperationRepository } from '../../repository/allowlist-operation/allowlist-operation.repository';
import { TokenPoolAsyncDownloader } from '../../token-pool/token-pool-async-downloader';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';

@Injectable()
export class TokenPoolDownloadService {
  constructor(
    private readonly tokenPoolDownloadRepository: TokenPoolDownloadRepository,
    private readonly componentWinners: PhaseComponentWinnerRepository,
    private readonly tokenPoolTokenRepository: TokenPoolTokenRepository,
    private readonly allowlistOperationRepository: AllowlistOperationRepository,
    private readonly tokenPoolAsyncDownloader: TokenPoolAsyncDownloader,
  ) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<TokenPoolDownloadResponseApiModel[]> {
    const entity = await this.tokenPoolDownloadRepository.getByAllowlistId(
      allowlistId,
    );
    return entity.map((download) => this.entityToApiModel(download));
  }

  async getTokenPoolUniqueWalletsCount({
    tokenPoolId,
    params: { excludeComponentWinners, excludeSnapshots, extraWallets },
  }: {
    tokenPoolId: string;
    params: TokenPoolDownloadTokenPoolUniqueWalletsCountRequestApiModel;
  }): Promise<number> {
    const [componentWinners, tokenPoolsWallets, tokenPoolWallets] =
      await Promise.all([
        new Set(
          excludeComponentWinners.length
            ? await this.componentWinners.getUniqueWalletsByComponentIds({
                componentIds: excludeComponentWinners,
              })
            : [],
        ),
        new Set(
          await this.tokenPoolTokenRepository.getUniqueWalletsByTokenPoolIds(
            excludeSnapshots
              .filter((s) => s.snapshotType === Pool.TOKEN_POOL)
              .map((s) => s.snapshotId),
          ),
        ),
        new Set([
          ...(await this.tokenPoolTokenRepository.getUniqueWalletsByTokenPoolId(
            tokenPoolId,
          )),
          ...extraWallets.map((wallet) => wallet.toLowerCase()),
        ]),
      ]);

    const customTokenPoolWallets = new Set<string>(
      excludeSnapshots
        .filter((s) => s.snapshotType === Pool.CUSTOM_TOKEN_POOL)
        .flatMap((s) => s.extraWallets),
    );

    const walletPoolWallets = new Set<string>(
      excludeSnapshots
        .filter((s) => s.snapshotType === Pool.WALLET_POOL)
        .flatMap((s) => s.extraWallets),
    );

    for (const value of componentWinners) {
      tokenPoolWallets.delete(value);
    }

    for (const value of tokenPoolsWallets) {
      tokenPoolWallets.delete(value);
    }

    for (const value of customTokenPoolWallets) {
      tokenPoolWallets.delete(value);
    }

    for (const value of walletPoolWallets) {
      tokenPoolWallets.delete(value);
    }
    return tokenPoolWallets.size;
  }

  async retry({
    allowlistId,
    tokenPoolId,
  }: {
    allowlistId: string;
    tokenPoolId: string;
  }): Promise<TokenPoolDownloadResponseApiModel> {
    const entity = await this.tokenPoolDownloadRepository.getByTokenPoolId({
      allowlistId,
      tokenPoolId,
    });
    if (!entity) {
      throw new NotFoundException(
        `Token pool download with ID ${tokenPoolId} does not exist`,
      );
    }

    const stale = this.isStale(entity);
    if (entity.status !== TokenPoolDownloadStatus.FAILED && !stale) {
      throw new BadRequestException(
        `Token pool download with ID ${tokenPoolId} cannot be retried in status ${entity.status}`,
      );
    }

    if (entity.status !== TokenPoolDownloadStatus.FAILED) {
      await this.tokenPoolDownloadRepository.recordFailureHistory({
        tokenPoolId,
        failureReason: this.getStaleReason(entity),
      });
    }

    const operation = await this.getCreateTokenPoolOperation({
      allowlistId,
      tokenPoolId,
    });
    await this.tokenPoolAsyncDownloader.start({
      config: {
        tokenPoolId,
        tokenIds: operation.params.tokenIds,
        contract: operation.params.contract,
        blockNo: operation.params.blockNo,
        consolidateBlockNo: operation.params.consolidateBlockNo ?? null,
        allowlistId,
      },
      state: {
        runsCount: 0,
        startingBlocks: [],
      },
    });

    const refreshed = await this.tokenPoolDownloadRepository.getByTokenPoolId({
      allowlistId,
      tokenPoolId,
    });
    if (!refreshed) {
      throw new NotFoundException(
        `Token pool download with ID ${tokenPoolId} no longer exists after retry`,
      );
    }
    return this.entityToApiModel(refreshed);
  }

  private entityToApiModel(
    entity: TokenPoolDownloadEntity,
  ): TokenPoolDownloadResponseApiModel {
    const rawStatus = entity.status;
    const stale = this.isStale(entity);
    const failureCount =
      entity.failure_count ??
      (rawStatus === TokenPoolDownloadStatus.FAILED ? 1 : 0);
    const errorReason =
      entity.error_reason ?? (stale ? this.getStaleReason(entity) : null);
    return {
      contract: entity.contract,
      tokenIds: entity.token_ids,
      tokenPoolId: entity.token_pool_id,
      allowlistId: entity.allowlist_id,
      blockNo: entity.block_no,
      status: stale ? TokenPoolDownloadStatus.FAILED : rawStatus,
      rawStatus,
      consolidateBlockNo: entity.consolidate_block_no,
      createdAt: bigInt2Number(entity.created_at),
      updatedAt: bigInt2Number(entity.updated_at),
      claimedAt: bigInt2Number(entity.claimed_at),
      lastHeartbeatAt: bigInt2Number(entity.last_heartbeat_at),
      completedAt: bigInt2Number(entity.completed_at),
      failedAt: bigInt2Number(entity.failed_at),
      stage: entity.stage ?? undefined,
      progress: this.parseProgress(entity.progress),
      attemptCount: entity.attempt_count ?? 0,
      failureCount,
      lastFailureAt:
        bigInt2Number(entity.last_failure_at) ?? bigInt2Number(entity.failed_at),
      lastFailureReason:
        entity.last_failure_reason ?? entity.error_reason ?? undefined,
      stale,
      errorReason,
      retryable: stale || rawStatus === TokenPoolDownloadStatus.FAILED,
    };
  }

  private parseProgress(
    progress?: string | null,
  ): Record<string, unknown> | undefined {
    if (!progress) {
      return undefined;
    }
    try {
      return JSON.parse(progress);
    } catch (e) {
      return { raw: progress };
    }
  }

  private isStale(entity: TokenPoolDownloadEntity): boolean {
    if (
      ![TokenPoolDownloadStatus.PENDING, TokenPoolDownloadStatus.CLAIMED].includes(
        entity.status,
      )
    ) {
      return false;
    }
    const referenceTime =
      bigInt2Number(entity.last_heartbeat_at) ??
      bigInt2Number(entity.updated_at) ??
      bigInt2Number(entity.claimed_at) ??
      bigInt2Number(entity.created_at);
    if (referenceTime === undefined) {
      return false;
    }
    return Time.currentMillis() - referenceTime > this.getStaleAfterMillis();
  }

  private getStaleAfterMillis(): number {
    return +(
      process.env.TOKEN_POOL_DOWNLOAD_STALE_AFTER_MS ??
      Time.minutes(20).toMillis()
    );
  }

  private getStaleReason(entity: TokenPoolDownloadEntity): string {
    const minutes = Math.floor(this.getStaleAfterMillis() / 60000);
    if (entity.status === TokenPoolDownloadStatus.PENDING) {
      return `Token pool download has been pending for more than ${minutes} minutes without new progress`;
    }
    return `Token pool download has not reported progress for more than ${minutes} minutes while in stage ${entity.stage ?? 'UNKNOWN'}`;
  }

  private async getCreateTokenPoolOperation({
    allowlistId,
    tokenPoolId,
  }: {
    allowlistId: string;
    tokenPoolId: string;
  }): Promise<{
    params: {
      tokenIds?: string;
      contract: string;
      blockNo: number;
      consolidateBlockNo?: number | null;
    };
  }> {
    const operations =
      await this.allowlistOperationRepository.getAllowlistOperationsByCode({
        allowlistId,
        code: AllowlistOperationCode.CREATE_TOKEN_POOL,
      });
    const operation = operations.find((candidate) => {
      try {
        return JSON.parse(candidate.params)?.id === tokenPoolId;
      } catch (e) {
        return false;
      }
    });
    if (!operation) {
      throw new NotFoundException(
        `Create token pool operation for token pool ${tokenPoolId} does not exist`,
      );
    }
    return {
      params: JSON.parse(operation.params),
    };
  }

  async getTokenPoolTokens({
    tokenPoolId,
  }: {
    tokenPoolId: string;
  }): Promise<TokenPoolDownloadTokenResponseApiModel[]> {
    const tokens = await this.tokenPoolTokenRepository.getTokenPoolsTokens([
      tokenPoolId,
    ]);
    return tokens.map((token) => ({
      address: token.wallet,
      token_id: token.token_id,
      balance: token.amount,
      contract: token.contract,
    }));
  }
}
