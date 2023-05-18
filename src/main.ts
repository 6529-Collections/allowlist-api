import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { initEnv } from './env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const envPort = +process.env.APP_PORT;
  await app.listen(envPort >= 0 || envPort < 65536 ? envPort : 3000);
}
initEnv().then(() => bootstrap());
