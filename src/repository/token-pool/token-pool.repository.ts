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
                    token_ids,
                    wallets_count,
                    tokens_count,
                    contract,
                    block_no,
                    consolidate_block_no
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
                    token_ids
                    wallets_count,
                    tokens_count,
                    contract,
                    block_no,
                    consolidate_block_no
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
        `INSERT INTO token_pool (external_id, name, description, allowlist_id,
                                         token_ids, wallets_count, tokens_count,
                                 contract,
                                 block_no,
                                 consolidate_block_no)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tokenPool.id,
          tokenPool.name,
          tokenPool.description,
          tokenPool.allowlist_id,
          tokenPool.token_ids || null,
          tokenPool.wallets_count,
          tokenPool.tokens_count,
          tokenPool.contract,
          tokenPool.block_no,
          tokenPool.consolidate_block_no,
        ],
        options,
      );
    }
  }
}
