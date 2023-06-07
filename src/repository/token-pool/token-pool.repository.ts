import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { DB } from '../db';
import { TokenPoolEntity } from './token-pool.entity';

@Injectable()
export class TokenPoolRepository {
  constructor(private readonly db: DB) {}

  async getByAllowlistId(allowlistId: string): Promise<TokenPoolEntity[]> {
    return this.db.many<TokenPoolEntity>(
      `SELECT external_id               as id,
                    name,
                    description,
                    allowlist_id,
                    transfer_pool_external_id as transfer_pool_id,
                    token_ids
             FROM token_pool
             WHERE allowlist_id = ?`,
      [allowlistId],
    );
  }

  async getAllowlistTokenPool({
    allowlistId,
    tokenPoolId,
  }: {
    allowlistId: string;
    tokenPoolId: string;
  }): Promise<TokenPoolEntity | null> {
    return this.db.one<TokenPoolEntity>(
      `SELECT external_id               as id,
                    name,
                    description,
                    allowlist_id,
                    transfer_pool_external_id as transfer_pool_id,
                    token_ids
             FROM token_pool
             WHERE allowlist_id = ?
               and external_id = ?`,
      [allowlistId, tokenPoolId],
    );
  }

  async createMany(
    tokenPools: TokenPoolEntity[],
    options: { connection?: mariadb.Connection },
  ): Promise<void> {
    for (const tokenPool of tokenPools) {
      await this.db.none(
        `INSERT INTO token_pool (external_id, name, description, allowlist_id, transfer_pool_external_id,
                                         token_ids)
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tokenPool.id,
          tokenPool.name,
          tokenPool.description,
          tokenPool.allowlist_id,
          tokenPool.transfer_pool_id,
          tokenPool.token_ids || null,
        ],
        options,
      );
    }
  }
}
