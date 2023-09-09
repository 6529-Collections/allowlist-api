import { Injectable } from '@nestjs/common';
import { DB } from '../db';
import * as mariadb from 'mariadb';
import { AllowlistOperationEntity } from './allowlist-operation.entity';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';

@Injectable()
export class AllowlistOperationRepository {
  constructor(private readonly db: DB) {}

  async save(
    entity: AllowlistOperationEntity,
    options?: { connection?: mariadb.Connection },
  ): Promise<AllowlistOperationEntity> {
    await this.db.none(
      `INSERT INTO allowlist_operation (id, code, params, created_at, op_order, has_ran, allowlist_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entity.id,
        entity.code,
        entity.params,
        entity.created_at,
        entity.op_order,
        entity.has_ran,
        entity.allowlist_id,
      ],
      options,
    );
    return entity;
  }

  async findByAllowlistId(
    allowlistId: string,
  ): Promise<AllowlistOperationEntity[]> {
    return this.db.many<AllowlistOperationEntity>(
      `SELECT id, created_at, code, op_order, has_ran, allowlist_id, params
             FROM allowlist_operation
             WHERE allowlist_id = ?
       ORDER BY op_order`,
      [allowlistId],
    );
  }

  async getAllRanForAllowlistSinceOrder(
    {
      allowlistId,
      order,
    }: {
      allowlistId: string;
      order: number;
    },
    options?: { connection?: mariadb.Connection },
  ): Promise<AllowlistOperationEntity[]> {
    return this.db.many<AllowlistOperationEntity>(
      `SELECT id,
                    created_at,
                    code,
                    op_order,
                    has_ran,
                    allowlist_id,
                    params
             FROM allowlist_operation
             WHERE allowlist_id = ?
               AND op_order >= ?
               AND has_ran = 1
               ORDER BY op_order`,
      [allowlistId, order],
      options,
    );
  }

  async updateAllForAllowlistToNotRan(
    allowlistId: string,
    options?: { connection?: mariadb.Connection },
  ) {
    await this.db.none(
      `UPDATE allowlist_operation
             SET has_ran = FALSE
             WHERE allowlist_id = ?`,
      [allowlistId],
      options,
    );
  }

  async incOrdersForAllowlistSinceOrder(
    {
      allowlistId,
      sinceOrder,
    }: {
      allowlistId: string;
      sinceOrder: number;
    },
    options?: { connection?: mariadb.Connection },
  ) {
    await this.db.none(
      `UPDATE allowlist_operation
                            SET op_order = op_order + 1
                            WHERE allowlist_id = ?
                              AND op_order >= ?`,
      [allowlistId, sinceOrder],
      options,
    );
  }

  async delete(
    { allowlistId, order }: { allowlistId: string; order: number },
    options?: { connection?: mariadb.Connection },
  ) {
    await this.db.none(
      `DELETE FROM allowlist_operation WHERE allowlist_id = ? AND op_order = ?`,
      [allowlistId, order],
      options,
    );
  }

  async decOrdersForAllowlistSinceOrder(
    { allowlistId, sinceOrder }: { allowlistId: string; sinceOrder: number },
    options?: { connection?: mariadb.Connection },
  ) {
    await this.db.none(
      `UPDATE allowlist_operation
                            SET op_order = op_order - 1
                            WHERE allowlist_id = ?
                              AND op_order >= ?`,
      [allowlistId, sinceOrder],
      options,
    );
  }

  async setAllAsNotRan(
    {
      allowlistId,
    }: {
      allowlistId: string;
    },
    options?: { connection?: mariadb.Connection },
  ): Promise<void> {
    await this.db.none(
      `UPDATE allowlist_operation
             SET has_ran = false
             WHERE allowlist_id = ?`,
      [allowlistId],
      options,
    );
  }

  async setAllAsRan(
    {
      allowlistId,
    }: {
      allowlistId: string;
    },
    options?: { connection?: mariadb.Connection },
  ): Promise<void> {
    await this.db.none(
      `UPDATE allowlist_operation
             SET has_ran = true
             WHERE allowlist_id = ?`,
      [allowlistId],
      options,
    );
  }

  async deleteByAllowlistId(
    {
      allowlistId,
    }: {
      allowlistId: string;
    },
    options?: { connection?: mariadb.Connection },
  ): Promise<void> {
    await this.db.none(
      `DELETE FROM allowlist_operation WHERE allowlist_id = ?`,
      [allowlistId],
      options,
    );
  }

  async getLatestOrderForAllowlist(
    allowlistId: string,
    options?: { connection?: mariadb.Connection },
  ): Promise<number> {
    const model = await this.db.one<{ op_order: number }>(
      `select max(op_order) as op_order from allowlist_operation where allowlist_id = ?`,
      [allowlistId],
      options,
    );
    return model?.op_order || 0;
  }

  async getAllowlistOperationsByCode({
    allowlistId,
    code,
    options,
  }: {
    allowlistId: string;
    code: AllowlistOperationCode;
    options?: { connection?: mariadb.Connection };
  }): Promise<AllowlistOperationEntity[]> {
    return this.db.many<AllowlistOperationEntity>(
      `SELECT id, created_at, code, op_order, has_ran, allowlist_id, params
             FROM allowlist_operation
             WHERE allowlist_id = ?
               AND code = ?
       ORDER BY op_order`,
      [allowlistId, code],
      options,
    );
  }

  async setOperationOrder(
    { operationId, order }: { operationId: string; order: number },
    options?: { connection?: mariadb.Connection },
  ): Promise<void> {
    await this.db.none(
      `UPDATE allowlist_operation SET op_order = ? WHERE id = ?`,
      [order, operationId],
      options,
    );
  }
}
