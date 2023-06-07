import * as DBMigrate from 'db-migrate';

export async function migrateDb() {
  const dbmigrate = await DBMigrate.getInstance(true, {
    config: './config/database.json',
    env: 'main',
  });
  await dbmigrate.up();
}
