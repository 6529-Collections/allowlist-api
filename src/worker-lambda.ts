import './sentry/instrument';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import type { Handler } from 'aws-lambda';
import { initEnv } from './env';
import { WorkerModule } from './worker.module';
import { RunnerService } from './runner/runner.service';
import { migrateDb } from './migrate';
import { DB } from './repository/db';
import * as Sentry from '@sentry/aws-serverless';
async function bootstrap(): Promise<INestApplication> {
  await initEnv();
  await migrateDb();
  const nestApp = await NestFactory.create(WorkerModule);
  nestApp.enableShutdownHooks();
  await nestApp.init();
  return nestApp;
}

export const handler: Handler = Sentry.wrapHandler(async (event: any) => {
  const nestApp = await bootstrap();
  const db = nestApp.get(DB);
  if (event?.__allowlistLambdaSmokeTest === true) {
    await db.close();
    await nestApp.close();
    return { ok: true };
  }
  console.log('Received event', event);
  const message = event.Records[0];
  const params = JSON.parse(JSON.parse(message.body).Message);
  const id = params?.allowlistRunId;
  if (!id) {
    throw new Error('No id provided');
  }
  const runsService = nestApp.get(RunnerService);
  await runsService.start(id);
  try {
    await db.close();
    await nestApp.close();
  } catch (e) {
    console.error(`Error closing server`, e);
  }
  return {};
});
