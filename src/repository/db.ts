import * as mariadb from 'mariadb';
import { Inject, Injectable } from '@nestjs/common';
import { APP_POOL } from './db.constants';

@Injectable()
export class DB {
  constructor(@Inject(APP_POOL) private readonly dbPool: mariadb.Pool) {}

  async getConnection(): Promise<mariadb.Connection> {
    return this.dbPool.getConnection();
  }

  async none(
    query: string,
    params: any[] = [],
    options?: { connection?: mariadb.Connection },
  ) {
    await this.execute(query, params, options);
  }

  async one<T>(
    query: string,
    params: any[] = [],
    options?: { connection?: mariadb.Connection },
  ): Promise<T | null> {
    const resp = await this.execute<T[]>(query, params, options);
    if (!resp?.length) {
      return null;
    }
    if (resp.length > 1) {
      throw new Error(`Expected one row, got ${resp.length}`);
    }
    return resp[0];
  }

  async many<T>(
    query: string,
    params: any[] = [],
    options?: { connection?: mariadb.Connection },
  ): Promise<T[]> {
    return this.execute<T[]>(query, params, options);
  }

  private async execute<T>(
    query: string,
    params: any[] = [],
    options?: { connection?: mariadb.Connection },
  ): Promise<T> {
    const isSuppliedConnection = !!options?.connection;
    const conn = isSuppliedConnection
      ? options?.connection
      : await this.getConnection();
    try {
      const rows = await conn.query(query, params);
      if (!isSuppliedConnection) {
        await conn.end();
      }
      return rows;
    } finally {
      if (!isSuppliedConnection) {
        await conn.end();
      }
    }
  }

  async close() {
    await this.dbPool.end();
  }
}
