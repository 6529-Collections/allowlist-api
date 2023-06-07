import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { PhaseComponentEntity } from './phase-component.entity';
import { DB } from '../db';

@Injectable()
export class PhaseComponentRepository {
  constructor(private readonly db: DB) {}

  async getByPhaseId(param: {
    allowlistId: string;
    phaseId: string;
  }): Promise<PhaseComponentEntity[]> {
    const { allowlistId, phaseId } = param;
    return this.db.many<PhaseComponentEntity>(
      `SELECT external_id as id, name, description, insertion_order, allowlist_id, phase_external_id as phase_id
             FROM phase_component
             WHERE allowlist_id = ?
               AND phase_external_id = ?`,
      [allowlistId, phaseId],
    );
  }

  async getAllowlistPhaseComponent(param: {
    allowlistId: string;
    phaseId: string;
    componentId: string;
  }): Promise<PhaseComponentEntity | null> {
    const { allowlistId, phaseId, componentId } = param;
    return this.db.one<PhaseComponentEntity>(
      `SELECT external_id as id, name, description, insertion_order, allowlist_id, phase_external_id as phase_id
             FROM phase_component
             WHERE allowlist_id = ?
               AND phase_external_id = ?
               AND external_id = ?`,
      [allowlistId, phaseId, componentId],
    );
  }

  async createMany(
    entities: PhaseComponentEntity[],
    options?: { connection?: mariadb.Connection },
  ): Promise<void> {
    for (const entity of entities) {
      await this.db.none(
        `INSERT INTO phase_component (external_id, name, description, insertion_order, allowlist_id,
                                              phase_external_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [
          entity.id,
          entity.name,
          entity.description,
          entity.insertion_order,
          entity.allowlist_id,
          entity.phase_id,
        ],
        options,
      );
    }
  }

  async getByAllowlistId(allowlistId: string): Promise<PhaseComponentEntity[]> {
    return this.db.many<PhaseComponentEntity>(
      `SELECT external_id as id, name, description, insertion_order, allowlist_id, phase_external_id as phase_id
             FROM phase_component
             WHERE allowlist_id = ?
             ORDER BY insertion_order`,
      [allowlistId],
    );
  }
}
