import * as mariadb from 'mariadb';

let poolInstance: mariadb.Pool;

export async function getPool(): Promise<mariadb.Pool> {
  if (!poolInstance) {
    poolInstance = await mariadb.createPool({
      host: 'localhost',
      user: 'root',
      password: 'mypass',
      connectionLimit: 5,
    });
  }
  return poolInstance;
}

export async function closePool() {
  const p = poolInstance;
  if (p) {
    poolInstance = undefined;
    await p.end();
  }
}

export async function dbQuery<T>(
  query: string,
  params: any[] = [],
): Promise<T> {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(query, params);
    await conn.end();
    return rows;
  } finally {
    await conn.end();
  }
}
