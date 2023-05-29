import { Context, Handler } from 'aws-lambda';

import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { initEnv } from './env';
import { WorkerModule } from './worker.module';

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
  console.log('Event itself', event);
  console.log('Type of event', typeof event);
  const message = event.Records[0];
  const job = JSON.parse(JSON.parse(message.body).Message);
  console.log(job);
  await cachedServer.close();
  cachedServer = null;
};
