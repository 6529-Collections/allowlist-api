import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { REQUEST_BODY_LIMIT } from './common/request-body-limit';

export function configureApiApplication(app: INestApplication): OpenAPIObject {
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() !== 'express') {
    throw new Error('The API bootstrap requires the Nest Express adapter.');
  }
  const expressApp = httpAdapter.getInstance();

  // Avoid disclosing the Express implementation/version in HTTP responses.
  expressApp.disable('x-powered-by');
  // Express 5 defaults to its simple query parser. Keep Express 4's nested and
  // array query-string behavior so this framework upgrade is API-compatible.
  expressApp.set('query parser', 'extended');

  app.use(json({ limit: REQUEST_BODY_LIMIT }));
  app.use(
    urlencoded({
      extended: true,
      limit: REQUEST_BODY_LIMIT,
    }),
  );
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Allowlist API')
    .setDescription('REST API for creating NFT allowlists')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  return document;
}
