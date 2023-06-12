import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AllowlistEntity } from './allowlist.entity';
import * as mariadb from 'mariadb';
import { Time } from '../../time';
import { DB } from '../db';

@Injectable()
export class AllowlistRepository {
  constructor(private readonly db: DB) {}

  async findAll(): Promise<AllowlistEntity[]> {
    return this.db.many<AllowlistEntity>(
      `select allowlist.*,
                    allowlist_run.status     as run_status,
                    allowlist_run.created_at as run_created_at,
                    allowlist_run.updated_at as run_updated_at
             from allowlist
                      left join allowlist_run on allowlist.id = allowlist_run.allowlist_id;`,
    );
  }

  async save(request: Omit<AllowlistEntity, 'id'>): Promise<AllowlistEntity> {
    const id = randomUUID();
    await this.db.none(
      'insert into allowlist (id, name, description, created_at) values (?, ?, ?, ?);',
      [id, request.name, request.description, request.created_at],
    );
    return await this.findById(id);
  }

  async findById(
    id: string,
    options?: { connection?: mariadb.Connection },
  ): Promise<AllowlistEntity | null> {
    return this.db.one<AllowlistEntity>(
      `select allowlist.*,
                    allowlist_run.status     as run_status,
                    allowlist_run.created_at as run_created_at,
                    allowlist_run.updated_at as run_updated_at
             from allowlist
                      left join allowlist_run on allowlist.id = allowlist_run.allowlist_id
             where allowlist.id = ?;`,
      [id],
      options,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.none('delete from allowlist where id = ?;', [id]);
  }

  async detachRun(
    { allowlistId }: { allowlistId: string },
    options?: { connection?: mariadb.Connection },
  ) {
    await this.db.none(
      `DELETE
             FROM allowlist_run
             WHERE allowlist_id = ?`,
      [allowlistId],
      options,
    );
  }

  async attachRun(
    {
      allowlistId,
      status,
    }: {
      allowlistId: string;
      status: string;
    },
    options?: { connection?: mariadb.Connection },
  ) {
    await this.db.none(
      `INSERT INTO allowlist_run (allowlist_id, created_at, status)
             VALUES (?, ?, ?)`,
      [allowlistId, Time.currentMillis(), status],
      options,
    );
  }

  async claimRun(
    allowlistId,
    options?: { connection?: mariadb.Connection },
  ): Promise<boolean> {
    const { id: runId } = await this.db.one<{ id: string }>(
      `select allowlist_run.allowlist_id as id
             from allowlist_run
             where allowlist_run.allowlist_id = ?
               and allowlist_run.status = 'PENDING' for update skip locked;`,
      [allowlistId],
      options,
    );
    if (!runId) {
      return false;
    }
    await this.db.none(
      `update allowlist_run
             set status = 'CLAIMED'
             where allowlist_id = ?;`,
      [runId],
      options,
    );
    return true;
  }

  async changeRunStatus({
    allowlistId,
    status,
  }: {
    allowlistId: string;
    status: string;
  }) {
    await this.db.none(
      `UPDATE allowlist_run
             SET status = ?
             WHERE allowlist_id = ?`,
      [status, allowlistId],
    );
  }
}
