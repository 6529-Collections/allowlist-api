import { NestFactory } from '@nestjs/core';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { initEnv } from './env';
import { migrateDb } from './migrate';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  await initEnv();
  if (process.env.ALLOWLIST_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.ALLOWLIST_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: true,
    });
  }
  await migrateDb();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('Allowlist API')
    .setDescription('REST API for creating NFT allowlists')
    .setBasePath('/staging')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
