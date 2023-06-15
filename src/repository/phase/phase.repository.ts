import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { DB } from '../db';
import { PhaseEntity } from './phase.entity';

@Injectable()
export class PhaseRepository {
  constructor(private readonly db: DB) {}

  async getByAllowlistId(allowlistId: string): Promise<PhaseEntity[]> {
    return this.db.many<PhaseEntity>(
      `SELECT external_id as id, name, description, insertion_order, allowlist_id, wallets_count, tokens_count
             FROM phase
             WHERE allowlist_id = ?
             ORDER BY insertion_order`,
      [allowlistId],
    );
  }

  async getAllowlistPhase({
    allowlistId,
    phaseId,
  }: {
    allowlistId: string;
    phaseId: string;
  }): Promise<PhaseEntity | null> {
    return this.db.one<PhaseEntity>(
      `SELECT external_id as id, name, description, insertion_order, allowlist_id, wallets_count, tokens_count
             FROM phase
             WHERE allowlist_id = ?
               AND external_id = ?`,
      [allowlistId, phaseId],
    );
  }

  async createMany(
    phases: PhaseEntity[],
    options?: { connection?: mariadb.Connection },
  ): Promise<void> {
    for (const phase of phases) {
      await this.db.none(
        `INSERT INTO phase (external_id, name, description, insertion_order, allowlist_id, wallets_count, tokens_count)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          phase.id,
          phase.name,
          phase.description,
          phase.insertion_order,
          phase.allowlist_id,
          phase.wallets_count,
          phase.tokens_count,
        ],
        options,
      );
    }
  }
}
