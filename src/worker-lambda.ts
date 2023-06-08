import { Context, Handler } from 'aws-lambda';

import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { initEnv } from './env';
import { WorkerModule } from './worker.module';
import { RunsService } from './runs/runs.service';

let cachedServer: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  await initEnv();
  if (!cachedServer) {
    const nestApp = await NestFactory.create(WorkerModule);

    await nestApp.init();
    cachedServer = nestApp;
  }
  return cachedServer;
}

export const handler: Handler = async (event: any, context: Context) => {
  cachedServer = await bootstrap();
  try {
    console.log('Received event', event);
    const message = event.Records[0];
    const params = JSON.parse(JSON.parse(message.body).Message);
    const id = params?.allowlistRunId;
    if (!id) {
      throw new Error('No id provided');
    }
    const runsService = cachedServer.get(RunsService);
    await runsService.start(id);
    context.succeed();
  } catch (e) {
    context.fail(e);
  } finally {
    try {
      await cachedServer.close();
    } catch (e) {
      console.log(`Error closing server`, e);
    }
    cachedServer = null;
  }
};
