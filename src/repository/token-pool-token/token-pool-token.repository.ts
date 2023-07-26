import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { DB } from '../db';
import { TokenPoolTokenEntity } from './token-pool-token.entity';
import { TokenOwnership } from '@6529-collections/allowlist-lib/allowlist/state-types/token-ownership';

@Injectable()
export class TokenPoolTokenRepository {
  constructor(private readonly db: DB) {}

  async insert(
    tokens: TokenPoolTokenEntity[],
    options: { connection?: mariadb.Connection },
  ): Promise<void> {
    for (const token of tokens) {
      await this.db.none(
        `INSERT INTO token_pool_token (id, contract, token_id, amount,
                                       wallet, token_pool_id, allowlist_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          token.id,
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

  async getTokenPoolTokens(
    tokenPoolId: string,
  ): Promise<TokenOwnership[] | null> {
    const tokens = await this.db.many<TokenPoolTokenEntity>(
      `
      SELECT id, contract, token_id, amount, wallet, token_pool_id, allowlist_id
      FROM token_pool_token
      WHERE token_pool_id = ?
      `,
      [tokenPoolId],
    );
    if (!tokens?.length) return null;
    return tokens.flatMap<TokenOwnership>((t) =>
      Array.from({ length: t.amount }, () => ({
        id: t.token_id,
        contract: t.contract,
        owner: t.wallet,
      })),
    );
  }

  async getTokenPoolsTokens(
    tokenPools: string[],
  ): Promise<TokenPoolTokenEntity[]> {
    if (!tokenPools?.length) return []
    const tokens = await this.db.many<TokenPoolTokenEntity>(
      `
      SELECT id, contract, token_id, amount, wallet, token_pool_id, allowlist_id
      FROM token_pool_token
      WHERE token_pool_id IN (?)
      `,
      [tokenPools],
    );
    if (!tokens?.length) return null;
    return tokens;
  }

  async getUniqueWalletsByTokenPoolId(tokenPoolId: string): Promise<string[]> {
    const resp = await this.db.many<{ wallet: string }>(
      `
      SELECT DISTINCT wallet
      FROM token_pool_token
      WHERE token_pool_id = ?
      `,
      [tokenPoolId],
    );
    return resp.map((item) => item.wallet.toLowerCase());
  }
}
