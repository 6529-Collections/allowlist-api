import { Context } from 'aws-lambda';

import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { initEnv } from './env';
import { WorkerModule } from './worker.module';
import { RunnerService } from './runner/runner.service';
import { migrateDb } from './migrate';
import { DB } from './repository/db';
import * as Sentry from '@sentry/serverless';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENV,
});
async function bootstrap(): Promise<INestApplication> {
  await initEnv();
  await migrateDb();
  const nestApp = await NestFactory.create(WorkerModule);
  nestApp.enableShutdownHooks();
  await nestApp.init();
  return nestApp;
}

export const handler = Sentry.AWSLambda.wrapHandler(
  async (event: any, context: Context) => {
    const nestApp = await bootstrap();
    const db = nestApp.get(DB);
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
    await context.succeed(event);
    return {};
  },
);
