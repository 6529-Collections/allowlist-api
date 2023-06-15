import { Injectable } from '@nestjs/common';
import { DB } from '../db';
import { CustomTokenPoolEntity } from './custom-token-pool.entity';
import * as mariadb from 'mariadb';

@Injectable()
export class CustomTokenPoolRepository {
  constructor(private readonly db: DB) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<CustomTokenPoolEntity[]> {
    return await this.db.many<CustomTokenPoolEntity>(
      `SELECT external_id as id, name, description, allowlist_id, wallets_count, tokens_count
             FROM custom_token_pool
             WHERE allowlist_id = ?`,
      [allowlistId],
    );
  }

  async getByExternalIdAndAllowlistId({
    allowlistId,
    customTokenPoolId,
  }: {
    allowlistId: string;
    customTokenPoolId: string;
  }): Promise<CustomTokenPoolEntity | null> {
    return await this.db.one<CustomTokenPoolEntity>(
      `SELECT external_id as id, name, description, allowlist_id, wallets_count, tokens_count
             FROM custom_token_pool
             WHERE allowlist_id = ?
               and external_id = ?`,
      [allowlistId, customTokenPoolId],
    );
  }

  async createMany({
    entities,
    options,
  }: {
    entities: CustomTokenPoolEntity[];
    options?: { connection?: mariadb.Connection };
  }): Promise<void> {
    for (const customTokenPool of entities) {
      await this.db.none(
        `INSERT INTO custom_token_pool (external_id, name, description, allowlist_id, wallets_count, tokens_count)
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [
          customTokenPool.id,
          customTokenPool.name,
          customTokenPool.description,
          customTokenPool.allowlist_id,
          customTokenPool.wallets_count,
          customTokenPool.tokens_count,
        ],
        options,
      );
    }
  }
}
