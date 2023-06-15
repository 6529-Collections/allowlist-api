import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { DB } from '../db';
import { WalletPoolEntity } from './wallet-pool.entity';

@Injectable()
export class WalletPoolRepository {
  constructor(private readonly db: DB) {}

  async getByAllowlistId(allowlistId: string): Promise<WalletPoolEntity[]> {
    return this.db.many<WalletPoolEntity>(
      `SELECT external_id as id, name, description, allowlist_id, wallets_count
             FROM wallet_pool
             WHERE allowlist_id = ?`,
      [allowlistId],
    );
  }

  async getAllowlistWalletPool({
    allowlistId,
    walletPoolId,
  }: {
    allowlistId: string;
    walletPoolId: string;
  }): Promise<WalletPoolEntity | null> {
    return this.db.one<WalletPoolEntity>(
      `SELECT external_id as id, name, description, allowlist_id, wallets_count
             FROM wallet_pool
             WHERE allowlist_id = ?
               AND external_id = ?`,
      [allowlistId, walletPoolId],
    );
  }

  async createMany(
    walletPools: WalletPoolEntity[],
    options?: { connection?: mariadb.Connection },
  ): Promise<void> {
    for (const entity of walletPools) {
      await this.db.none(
        `INSERT INTO wallet_pool (external_id, name, description, allowlist_id, wallets_count)
                 VALUES (?, ?, ?, ?, ?)`,
        [
          entity.id,
          entity.name,
          entity.description,
          entity.allowlist_id,
          entity.wallets_count,
        ],
        options,
      );
    }
  }
}
