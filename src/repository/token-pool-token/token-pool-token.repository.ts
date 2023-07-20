import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { DB } from '../db';
import { TokenPoolTokenEntity } from './token-pool-token.entity';

@Injectable()
export class TokenPoolTokenRepository {
  constructor(private readonly db: DB) {}

  async upsert(
    tokens: TokenPoolTokenEntity[],
    options: { connection?: mariadb.Connection },
  ): Promise<void> {
    for (const token of tokens) {
      await this.db.none(
        `INSERT INTO token_pool_token (contract, token_id, amount,
                                       wallet, token_pool_id, allowlist_id)
                 VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = amount`,
        [
          token.contract,
          token.token_id,
          token.amount,
          token.wallet,
          token.token_pool_id,
          token.allowlist_id,
        ],
        options,
      );
    }
  }
}
