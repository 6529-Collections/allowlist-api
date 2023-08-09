import { Context, Handler } from 'aws-lambda';

import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { initEnv } from './env';
import { migrateDb } from './migrate';
import { DB } from './repository/db';
import { TokenPoolDownloaderService } from './token-pool/token-pool-downloader.service';
import { TokenDownloaderModule } from './token-downloader.module';
import { TokenPoolAsyncDownloader } from './token-pool/token-pool-async-downloader';
import { TokenPoolDownloaderParams } from './token-pool/token-pool.types';

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
    const params: TokenPoolDownloaderParams = JSON.parse(
      JSON.parse(message.body).Message,
    );
    if (!params) {
      throw new Error('No params provided');
    }
    const { config, state } = params;
    if (!config || !state) {
      throw new Error('No config or state provided');
    }
    const { tokenPoolId } = config;
    if (!tokenPoolId) {
      throw new Error('No id provided');
    }
    const { runsCount, startingBlocks } = state;
    if (runsCount !== startingBlocks.length) {
      console.error(
        `Invalid state: runsCount ${runsCount} !== startingBlocks.length ${startingBlocks.length}`,
      );
      throw new Error('Invalid state');
    }
    state.runsCount++;
    console.log('Run count', state.runsCount);
    const result = await service.start({ config, state });
    if (result?.continue) {
      const downloadScheduler = nestApp.get(TokenPoolAsyncDownloader);
      await downloadScheduler.start({
        config: {
          contract: result.entity.contract,
          tokenIds: result.entity.token_ids,
          tokenPoolId: result.entity.token_pool_id,
          allowlistId: result.entity.allowlist_id,
          blockNo: result.entity.block_no,
          consolidateBlockNo: result.entity.consolidate_block_no,
        },
        state,
      });
    }
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
