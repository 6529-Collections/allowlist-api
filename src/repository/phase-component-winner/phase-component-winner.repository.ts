import { Injectable } from '@nestjs/common';
import * as mariadb from 'mariadb';
import { DB } from '../db';
import { PhaseComponentWinnerEntity } from './phase-component-winner.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class PhaseComponentWinnerRepository {
  constructor(private readonly db: DB) {}

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
}
