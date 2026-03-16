import { Injectable } from '@nestjs/common';
import { DB } from '../db';
import { TokenPoolDownloadEntity } from './token-pool-download.entity';
import * as mariadb from 'mariadb';
import { TokenPoolDownloadStatus } from './token-pool-download-status';
import { Time } from '../../time';
import { TokenPoolDownloadStage } from './token-pool-download-stage';

@Injectable()
export class TokenPoolDownloadRepository {
  constructor(private readonly db: DB) {}

  private readonly selectColumns = `select contract,
                                           token_ids,
                                           token_pool_id,
                                           allowlist_id,
                                           block_no,
                                           status,
                                           consolidate_block_no,
                                           created_at,
                                           updated_at,
                                           claimed_at,
                                           last_heartbeat_at,
                                           completed_at,
                                           failed_at,
                                           error_reason,
                                           failure_count,
                                           last_failure_at,
                                           last_failure_reason,
                                           attempt_count,
                                           stage,
                                           progress
                                    from token_pool_download`;

  async delete(tokenPoolId: string) {
    await this.db.none(
      `delete from token_pool_download where token_pool_id = ?`,
      [tokenPoolId],
    );
  }

  async save(entity: TokenPoolDownloadEntity) {
    await this.db.none(
      `insert into token_pool_download (
          allowlist_id,
          token_pool_id,
          contract,
          token_ids,
          block_no,
          status,
          consolidate_block_no,
          created_at,
          updated_at,
          claimed_at,
          last_heartbeat_at,
          completed_at,
          failed_at,
          error_reason,
          failure_count,
          last_failure_at,
          last_failure_reason,
          attempt_count,
          stage,
          progress
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on duplicate key update
          allowlist_id = values(allowlist_id),
          contract = values(contract),
          token_ids = values(token_ids),
          block_no = values(block_no),
          status = values(status),
          consolidate_block_no = values(consolidate_block_no),
          created_at = values(created_at),
          updated_at = values(updated_at),
          claimed_at = values(claimed_at),
          last_heartbeat_at = values(last_heartbeat_at),
          completed_at = values(completed_at),
          failed_at = values(failed_at),
          error_reason = values(error_reason),
          failure_count = coalesce(token_pool_download.failure_count, 0),
          last_failure_at = token_pool_download.last_failure_at,
          last_failure_reason = token_pool_download.last_failure_reason,
          attempt_count = values(attempt_count),
          stage = values(stage),
          progress = values(progress)`,
      [
        entity.allowlist_id,
        entity.token_pool_id,
        entity.contract,
        entity.token_ids || null,
        entity.block_no,
        entity.status,
        entity.consolidate_block_no,
        entity.created_at ?? null,
        entity.updated_at ?? null,
        entity.claimed_at ?? null,
        entity.last_heartbeat_at ?? null,
        entity.completed_at ?? null,
        entity.failed_at ?? null,
        entity.error_reason ?? null,
        entity.failure_count ?? 0,
        entity.last_failure_at ?? null,
        entity.last_failure_reason ?? null,
        entity.attempt_count ?? 0,
        entity.stage ?? null,
        entity.progress ?? null,
      ],
    );
  }

  async claim(
    tokenPoolId: string,
    options?: { connection?: mariadb.Connection },
  ): Promise<TokenPoolDownloadEntity | null> {
    const entity = await this.db.one<TokenPoolDownloadEntity>(
      `${this.selectColumns}
             where token_pool_download.token_pool_id = ?
               and token_pool_download.status = ? for update skip locked;`,
      [tokenPoolId, TokenPoolDownloadStatus.PENDING],
      options,
    );
    if (!entity) {
      return null;
    }
    const now = Time.currentMillis();
    await this.db.none(
      `update token_pool_download
             set status = ?,
                 error_reason = null,
                 claimed_at = ?,
                 last_heartbeat_at = ?,
                 updated_at = ?,
                 failed_at = null,
                 completed_at = null,
                 attempt_count = coalesce(attempt_count, 0) + 1,
                 stage = ?
             where token_pool_id = ?;`,
      [
        TokenPoolDownloadStatus.CLAIMED,
        now,
        now,
        now,
        TokenPoolDownloadStage.CLAIMED,
        tokenPoolId,
      ],
      options,
    );
    return {
      ...entity,
      status: TokenPoolDownloadStatus.CLAIMED,
      error_reason: null,
      claimed_at: BigInt(now),
      last_heartbeat_at: BigInt(now),
      updated_at: BigInt(now),
      failed_at: null,
      completed_at: null,
      attempt_count: (entity.attempt_count ?? 0) + 1,
      stage: TokenPoolDownloadStage.CLAIMED,
    };
  }

  async getByTokenPoolId({
    allowlistId,
    tokenPoolId,
  }: {
    allowlistId: string;
    tokenPoolId: string;
  }): Promise<TokenPoolDownloadEntity | null> {
    return this.db.one<TokenPoolDownloadEntity>(
      `${this.selectColumns}
             where token_pool_download.allowlist_id = ?
               and token_pool_download.token_pool_id = ?`,
      [allowlistId, tokenPoolId],
    );
  }

  async requeue({
    tokenPoolId,
    progress,
  }: {
    tokenPoolId: string;
    progress?: string | null;
  }) {
    const now = Time.currentMillis();
    await this.db.none(
      `update token_pool_download
             set status = ?,
                 updated_at = ?,
                 last_heartbeat_at = ?,
                 stage = ?,
                 progress = ?,
                 error_reason = null,
                 failed_at = null
             where token_pool_id = ?`,
      [
        TokenPoolDownloadStatus.PENDING,
        now,
        now,
        TokenPoolDownloadStage.REQUEUED,
        progress ?? null,
        tokenPoolId,
      ],
    );
  }

  async updateProgress({
    tokenPoolId,
    stage,
    progress,
  }: {
    tokenPoolId: string;
    stage: TokenPoolDownloadStage;
    progress?: string | null;
  }) {
    const now = Time.currentMillis();
    await this.db.none(
      `update token_pool_download
             set updated_at = ?,
                 last_heartbeat_at = ?,
                 stage = ?,
                 progress = ?
             where token_pool_id = ?`,
      [now, now, stage, progress ?? null, tokenPoolId],
    );
  }

  async recordFailureHistory({
    tokenPoolId,
    failureReason,
  }: {
    tokenPoolId: string;
    failureReason: string;
  }) {
    const now = Time.currentMillis();
    await this.db.none(
      `update token_pool_download
             set failure_count = coalesce(failure_count, 0) + 1,
                 last_failure_at = ?,
                 last_failure_reason = ?
             where token_pool_id = ?`,
      [now, failureReason, tokenPoolId],
    );
  }

  async changeStatusToCompleted({
    tokenPoolId,
    connection,
    progress,
  }: {
    tokenPoolId: string;
    connection?: mariadb.Connection;
    progress?: string | null;
  }) {
    const now = Time.currentMillis();
    await this.db.none(
      `UPDATE token_pool_download
              SET status = ?,
                  stage = ?,
                  progress = ?,
                  error_reason = null,
                  updated_at = ?,
                  last_heartbeat_at = ?,
                  completed_at = ?,
                  failed_at = null
              WHERE token_pool_id = ?`,
      [
        TokenPoolDownloadStatus.COMPLETED,
        TokenPoolDownloadStage.COMPLETED,
        progress ?? null,
        now,
        now,
        now,
        tokenPoolId,
      ],
      { connection },
    );
  }

  async changeStatusToError({
    tokenPoolId,
    errorReason,
  }: {
    tokenPoolId: string;
    errorReason?: string;
  }) {
    const now = Time.currentMillis();
    await this.db.none(
      `UPDATE token_pool_download
             SET status = ?,
                 stage = ?,
                 error_reason = ?,
                 failure_count = coalesce(failure_count, 0) + 1,
                 last_failure_at = ?,
                 last_failure_reason = ?,
                 updated_at = ?,
                 last_heartbeat_at = ?,
                 failed_at = ?
             WHERE token_pool_id = ?`,
      [
        TokenPoolDownloadStatus.FAILED,
        TokenPoolDownloadStage.FAILED,
        errorReason ?? null,
        now,
        errorReason ?? null,
        now,
        now,
        now,
        tokenPoolId,
      ],
    );
  }

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<TokenPoolDownloadEntity[]> {
    return this.db.many<TokenPoolDownloadEntity>(
      `${this.selectColumns}
             where token_pool_download.allowlist_id = ?`,
      [allowlistId],
    );
  }
}
