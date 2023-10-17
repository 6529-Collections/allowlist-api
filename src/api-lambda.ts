import { NestFactory } from '@nestjs/core';
import { createServer, proxy } from 'aws-serverless-express';
import { Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { Server } from 'http';
import { ValidationPipe } from '@nestjs/common';
import { initEnv } from './env';
import { migrateDb } from './migrate';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/serverless';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { eventContext } from 'aws-serverless-express/middleware';

console.log('Initializing sentry ' + process.env.SENTRY_DSN?.at(10));
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENV,
  debug: true,
});

let server: Server;

async function bootstrap(): Promise<Server> {
  await initEnv();
  await migrateDb();
  const expressApp = express();
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  nestApp.use(eventContext());
  nestApp.enableCors();
  nestApp.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('Allowlist API')
    .setDescription('REST API for creating NFT allowlists')
    .setBasePath('/staging')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(nestApp, config);
  SwaggerModule.setup('api', nestApp, document);
  await nestApp.init();

  return createServer(expressApp, undefined, undefined);
}

export const handler: Handler = Sentry.AWSLambda.wrapHandler(
  async (event: any, context: Context) => {
    server = server ?? (await bootstrap());
    return proxy(server, event, context, 'PROMISE').promise;
  },
);
