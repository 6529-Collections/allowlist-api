import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { DB } from '../db';
import { PhaseComponentWinnerEntity } from './phase-component-winner.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class PhaseComponentWinnerRepository {
  constructor(private readonly db: DB) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<PhaseComponentWinnerEntity[]> {
    return this.db.many<PhaseComponentWinnerEntity>(
      `SELECT id, wallet, phase_external_id as phase_id, allowlist_id, amount, phase_component_external_id as phase_component_id
              FROM phase_component_winner
              WHERE allowlist_id = ?`,
      [allowlistId],
    );
  }

  async getByPhaseId(param: {
    allowlistId: string;
    phaseId: string;
  }): Promise<PhaseComponentWinnerEntity[]> {
    return this.db.many<PhaseComponentWinnerEntity>(
      `SELECT id, wallet, phase_external_id as phase_id, allowlist_id, amount, phase_component_external_id as phase_component_id
              FROM phase_component_winner
              WHERE allowlist_id = ?
                AND phase_external_id = ?`,
      [param.allowlistId, param.phaseId],
    );
  }

  async getByPhaseComponentId(param: {
    allowlistId: string;
    phaseId: string;
    phaseComponentId: string;
  }): Promise<PhaseComponentWinnerEntity[]> {
    return this.db.many<PhaseComponentWinnerEntity>(
      `SELECT id, wallet, phase_external_id as phase_id, allowlist_id, amount, phase_component_external_id as phase_component_id
              FROM phase_component_winner
              WHERE allowlist_id = ?
                AND phase_external_id = ?
                AND phase_component_external_id = ?`,
      [param.allowlistId, param.phaseId, param.phaseComponentId],
    );
  }

  async createMany(
    entities: Omit<PhaseComponentWinnerEntity, 'id'>[],
    options?: { connection?: mariadb.Connection },
  ) {
    for (const entity of entities) {
      await this.db.none(
        `INSERT INTO phase_component_winner (id, wallet, phase_external_id, allowlist_id, amount,
                                                     phase_component_external_id)
                 values (?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          entity.wallet,
          entity.phase_id,
          entity.allowlist_id,
          entity.amount,
          entity.phase_component_id,
        ],
        options,
      );
    }
  }

  async getUniqueWalletsByComponentIds(param: {
    componentIds: string[];
  }): Promise<string[]> {
    const componentIds = param.componentIds;
    if (!componentIds.length) {
      return [];
    }
    return (
      await this.db.many<{ wallet: string }>(
        `SELECT DISTINCT wallet
              FROM phase_component_winner
              WHERE phase_component_external_id IN (${componentIds
                .map(() => '?')
                .join(',')})`,
        componentIds,
      )
    ).map((item) => item.wallet.toLowerCase());
  }

  async getWinnersByComponentIds(param: {
    componentIds: string[];
  }): Promise<PhaseComponentWinnerEntity[]> {
    const componentIds = param.componentIds;
    if (!componentIds.length) {
      return [];
    }
    return this.db.many<PhaseComponentWinnerEntity>(
      `SELECT id, wallet, phase_external_id as phase_id, allowlist_id, amount, phase_component_external_id as phase_component_id
              FROM phase_component_winner
              WHERE phase_component_external_id IN (${componentIds
                .map(() => '?')
                .join(',')})`,
      componentIds,
    );
  }
}
