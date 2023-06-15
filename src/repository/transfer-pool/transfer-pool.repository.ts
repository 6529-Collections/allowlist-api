import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { DB } from '../db';
import { TransferPoolEntity } from './transfer-pool.entity';

@Injectable()
export class TransferPoolRepository {
  constructor(private readonly db: DB) {}

  async getByAllowlistId(allowlistId: string): Promise<TransferPoolEntity[]> {
    return this.db.many<TransferPoolEntity>(
      `SELECT external_id as id, name, description, contract, block_no, allowlist_id, transfers_count
             FROM transfer_pool
             WHERE allowlist_id = ?`,
      [allowlistId],
    );
  }

  async getAllowlistTransferPool(param: {
    allowlistId: string;
    transferPoolId: string;
  }): Promise<TransferPoolEntity | null> {
    const { allowlistId, transferPoolId } = param;
    return this.db.one<TransferPoolEntity>(
      `SELECT external_id as id, name, description, contract, block_no, allowlist_id, transfers_count
             FROM transfer_pool
             WHERE allowlist_id = ?
               AND external_id = ?`,
      [allowlistId, transferPoolId],
    );
  }

  async createMany(
    transferPools: TransferPoolEntity[],
    options?: { connection?: mariadb.Connection },
  ): Promise<void> {
    for (const entity of transferPools) {
      await this.db.none(
        `INSERT INTO transfer_pool (external_id, name, description, contract, block_no,
                                                           allowlist_id, transfers_count)
                                VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entity.id,
          entity.name,
          entity.description,
          entity.contract,
          entity.block_no,
          entity.allowlist_id,
          entity.transfers_count,
        ],
        options,
      );
    }
  }
}
