import { Injectable } from '@nestjs/common';
import { DB } from '../db';
import { AllowlistUserEntity } from './allowlist-user.entity';
import * as mariadb from 'mariadb';

@Injectable()
export class AllowlistUserRepository {
  constructor(private readonly db: DB) {}

  async save({
    entity,
    options,
  }: {
    entity: AllowlistUserEntity;
    options?: { connection?: mariadb.Connection };
  }): Promise<AllowlistUserEntity> {
    await this.db.none(
      `INSERT INTO allowlist_user (allowlist_id, user_wallet, created_at)
                 VALUES (?, ?, ?)`,
      [entity.allowlist_id, entity.user_wallet, entity.created_at],
      options,
    );
    return entity;
  }

  async createdAllowlistsCountAfterTime({
    wallets,
    createdAt,
  }: {
    wallets: string[];
    createdAt: bigint;
  }): Promise<bigint> {
    const result = await this.db.one<{ count: bigint }>(
      `SELECT COUNT(*) as count
       FROM allowlist_user
       WHERE user_wallet IN (${wallets.map(() => '?').join(',')})
         AND created_at >= ?`,
      [...wallets, createdAt],
    );
    return result.count;
  }

  async getAllowlistIdsForWallet({
    wallet,
  }: {
    wallet: string;
  }): Promise<string[]> {
    const result = await this.db.many<{ allowlist_id: string }>(
      `SELECT allowlist_id
       FROM allowlist_user
       WHERE user_wallet = ?`,
      [wallet],
    );
    return result.map((row) => row.allowlist_id);
  }
}
