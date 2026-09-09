import './sentry/instrument';
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import type { Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { initEnv } from './env';
import { migrateDb } from './migrate';
import * as Sentry from '@sentry/aws-serverless';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { configureApiApplication } from './api-bootstrap';

type ServerlessExpressHandler = ReturnType<typeof serverlessExpress>;
type PromiseServerlessExpressHandler = (
  event: unknown,
  context: Context,
) => Promise<unknown>;

let serverlessExpressInstance: ServerlessExpressHandler;

async function bootstrap(): Promise<ServerlessExpressHandler> {
  await initEnv();
  await migrateDb();
  const expressApp = express();
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  configureApiApplication(nestApp);
  await nestApp.init();

  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = Sentry.wrapHandler(
  async (event: any, context: Context) => {
    serverlessExpressInstance =
      serverlessExpressInstance ?? (await bootstrap());
    return (
      serverlessExpressInstance as unknown as PromiseServerlessExpressHandler
    )(event, context);
  },
);
