import './sentry/instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initEnv } from './env';
import { migrateDb } from './migrate';
import { configureApiApplication } from './api-bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  configureApiApplication(app);
  const envPort = +process.env.ALLOWLIST_APP_PORT;
  await app.listen(envPort >= 0 || envPort < 65536 ? envPort : 3000);
}
initEnv()
  .then(() => migrateDb())
  .then(() => bootstrap());
