import { Context, Handler } from 'aws-lambda';

import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { initEnv } from './env';
import { migrateDb } from './migrate';
import { DB } from './repository/db';
import { TokenPoolDownloaderService } from './token-pool/token-pool-downloader.service';
import { TokenDownloaderModule } from './token-downloader.module';

async function bootstrap(): Promise<INestApplication> {
  await initEnv();
  await migrateDb();
  const nestApp = await NestFactory.create(TokenDownloaderModule);
  nestApp.enableShutdownHooks();
  await nestApp.init();
  return nestApp;
}

export const handler: Handler = async (event: any, context: Context) => {
  const nestApp = await bootstrap();
  const service = nestApp.get(TokenPoolDownloaderService);
  try {
    console.log('Received event', event);
    const message = event.Records[0];
    const params = JSON.parse(JSON.parse(message.body).Message);
    const id = params?.tokenPoolId;
    if (!id) {
      throw new Error('No id provided');
    }
    await service.start(id);
    try {
      await nestApp.get(DB).close();
      await nestApp.close();
    } catch (e) {
      console.error(`Error closing server`, e);
    }
    await context.succeed();
  } catch (e) {
    console.error('Error running worker', e);
    await context.fail(e);
  }
  return {};
};
