import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { PhaseComponentItemEntity } from './phase-component-item.entity';
import { DB } from '../db';

@Injectable()
export class PhaseComponentItemRepository {
  constructor(private readonly db: DB) {}

  async getByPhaseComponentId(param: {
    allowlistId: string;
    phaseId: string;
    phaseComponentId: string;
  }): Promise<PhaseComponentItemEntity[]> {
    const { allowlistId, phaseId, phaseComponentId } = param;

    return this.db.many<PhaseComponentItemEntity>(
      `SELECT external_id                 as id,
                    name,
                    description,
                    insertion_order,
                    phase_external_id           as phase_id,
                    phase_component_external_id as phase_component_id,
                    allowlist_id,
                    pool_id,
                    pool_type,
                    wallets_count,
                    tokens_count
             FROM phase_component_item
             WHERE allowlist_id = ?
               AND phase_external_id = ?
               AND phase_component_external_id = ?
             order by insertion_order`,
      [allowlistId, phaseId, phaseComponentId],
    );
  }

  async getAllowlistPhaseComponentItem(param: {
    allowlistId: string;
    phaseId: string;
    phaseComponentId: string;
    id: string;
  }): Promise<PhaseComponentItemEntity | null> {
    return this.db.one<PhaseComponentItemEntity>(
      `SELECT external_id                 as id,
                    name,
                    description,
                    insertion_order,
                    phase_external_id           as phase_id,
                    phase_component_external_id as phase_component_id,
                    allowlist_id,
                    pool_id,
                    pool_type,
                    wallets_count,
                    tokens_count,
                    contract,
                    block_no,
                    consolidate_block_no
             FROM phase_component_item
             WHERE allowlist_id = ?
               AND phase_external_id = ?
               AND phase_component_external_id = ?
               AND external_id = ?`,
      [param.allowlistId, param.phaseId, param.phaseComponentId, param.id],
    );
  }

  async createMany(
    entities: PhaseComponentItemEntity[],
    options?: { connection?: mariadb.Connection },
  ): Promise<void> {
    for (const entity of entities) {
      await this.db.none(
        `INSERT INTO phase_component_item (external_id, name, description, insertion_order,
                                                   phase_external_id, allowlist_id,
                                                   phase_component_external_id, pool_id, pool_type, wallets_count, tokens_count,
            contract, block_no, consolidate_block_no)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entity.id,
          entity.name,
          entity.description,
          entity.insertion_order,
          entity.phase_id,
          entity.allowlist_id,
          entity.phase_component_id,
          entity.pool_id,
          entity.pool_type,
          entity.wallets_count,
          entity.tokens_count,
          entity.contract,
          entity.block_no,
          entity.consolidate_block_no,
        ],
        options,
      );
    }
  }

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<PhaseComponentItemEntity[]> {
    return this.db.many<PhaseComponentItemEntity>(
      `SELECT external_id                 as id,
                    name,
                    description,
                    insertion_order,
                    phase_external_id           as phase_id,
                    phase_component_external_id as phase_component_id,
                    allowlist_id,
                    pool_id,
                    pool_type,
                    wallets_count,
                    tokens_count,
                    contract, 
                    block_no, 
                    consolidate_block_no
             FROM phase_component_item
             WHERE allowlist_id = ?
             order by insertion_order`,
      [allowlistId],
    );
  }
}
