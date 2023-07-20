import { Injectable } from '@nestjs/common';
import { DB } from '../db';
import { TokenPoolDownloadEntity } from './token-pool-download.entity';
import * as mariadb from 'mariadb';
import { TokenPoolDownloadStatus } from './token-pool-download-status';

@Injectable()
export class TokenPoolDownloadRepository {
  constructor(private readonly db: DB) {}

  async save(entity: TokenPoolDownloadEntity) {
    await this.db.none(
      `insert into token_pool_download (allowlist_id, token_pool_id, contract, token_ids, block_no, status) values (?, ?, ?, ?, ?, ?)`,
      [
        entity.allowlist_id,
        entity.token_pool_id,
        entity.contract,
        entity.token_ids,
        entity.block_no,
        entity.status,
      ],
    );
  }

  async claim(
    tokenPoolId: string,
    options?: { connection?: mariadb.Connection },
  ): Promise<TokenPoolDownloadEntity | null> {
    const entity = await this.db.one<TokenPoolDownloadEntity>(
      `select contract, token_ids, token_pool_id, allowlist_id, block_no, status
             from token_pool_download
             where token_pool_download.token_pool_id = ?
               and token_pool_download.status = ? for update skip locked;`,
      [tokenPoolId, TokenPoolDownloadStatus.PENDING],
      options,
    );
    if (!entity) {
      return null;
    }
    await this.db.none(
      `update token_pool_download
             set status = ?
             where token_pool_id = ?;`,
      [TokenPoolDownloadStatus.CLAIMED, tokenPoolId],
      options,
    );
    return { ...entity, status: TokenPoolDownloadStatus.CLAIMED };
  }

  async changeStatusToCompleted({
    tokenPoolId,
    connection,
  }: {
    tokenPoolId: string;
    connection?: mariadb.Connection;
  }) {
    await this.db.none(
      `UPDATE token_pool_download
              SET status = ?
              WHERE token_pool_id = ?`,
      [TokenPoolDownloadStatus.COMPLETED, tokenPoolId],
      { connection },
    );
  }

  async changeStatusToError({ tokenPoolId }: { tokenPoolId: string }) {
    await this.db.none(
      `UPDATE token_pool_download
             SET status = ?
             WHERE token_pool_id = ?`,
      [TokenPoolDownloadStatus.FAILED, tokenPoolId],
    );
  }
}
