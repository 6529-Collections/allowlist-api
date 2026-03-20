import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { initEnv } from './env';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { migrateDb } from './migrate';
import { json, urlencoded } from 'express';
import { REQUEST_BODY_LIMIT } from './common/request-body-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: REQUEST_BODY_LIMIT }));
  app.use(
    urlencoded({
      extended: true,
      limit: REQUEST_BODY_LIMIT,
    }),
  );
  app.enableShutdownHooks();
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Allowlist API')
    .setDescription('REST API for creating NFT allowlists')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const envPort = +process.env.ALLOWLIST_APP_PORT;
  await app.listen(envPort >= 0 || envPort < 65536 ? envPort : 3000);
}
initEnv()
  .then(() => migrateDb())
  .then(() => bootstrap());
