import {
  BadRequestException,
  Body,
  Controller,
  Get,
  INestApplication,
  Module,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ApiProperty } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { IsString, MinLength } from 'class-validator';
import request from 'supertest';
import { configureApiApplication } from './api-bootstrap';
import { AccessTokenGuard } from './api/auth/access-token.guard';
import { AccessTokenStrategy } from './api/auth/access.token.strategy';
import { AUTH_CONFIG, AuthConfig } from './api/auth/auth.config';
import { PublicEndpoint } from './api/auth/public-endpoint-decorator';
import { Time } from './time';
import type { Context } from 'aws-lambda';

class CompatibilityRequest {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  readonly name: string;
}

@Controller('compatibility')
class CompatibilityController {
  @PublicEndpoint()
  @Post('validate')
  validate(@Body() body: CompatibilityRequest): CompatibilityRequest {
    return body;
  }

  @PublicEndpoint()
  @Get('query')
  query(@Query('tag') tags: string[]): { tags: string[] } {
    return { tags };
  }

  @PublicEndpoint()
  @Get('error')
  error(): never {
    throw new BadRequestException('Expected validation error');
  }

  @Get('protected')
  protected(@Request() request: { user: { wallet: string } }): {
    wallet: string;
  } {
    return request.user;
  }
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ secret: 'compatibility-test-secret' }),
  ],
  controllers: [CompatibilityController],
  providers: [
    AccessTokenStrategy,
    {
      provide: AUTH_CONFIG,
      useValue: {
        authTokenSecret: 'compatibility-test-secret',
        refreshTokenSecret: 'compatibility-refresh-secret',
        authTokenExpiry: Time.seconds(300),
        refreshTokenExpiry: Time.seconds(600),
      } satisfies AuthConfig,
    },
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
  ],
})
class CompatibilityModule {}

describe('Nest, Express, validation, Swagger, and auth compatibility', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [CompatibilityModule],
    }).compile();

    app = testingModule.createNestApplication();
    configureApiApplication(app);
    await app.init();
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('preserves DTO validation responses and successful body handling', async () => {
    await request(app.getHttpServer())
      .post('/compatibility/validate')
      .send({ name: 'valid' })
      .expect(201)
      .expect({ name: 'valid' });

    const response = await request(app.getHttpServer())
      .post('/compatibility/validate')
      .send({ name: '' })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(response.body.message).toContain(
      'name must be longer than or equal to 2 characters',
    );
  });

  it('keeps Express 4-compatible array query parsing', async () => {
    await request(app.getHttpServer())
      .get('/compatibility/query?tag[]=one&tag[]=two')
      .expect(200)
      .expect({ tags: ['one', 'two'] });
  });

  it('preserves Nest exception status codes and response shape', async () => {
    await request(app.getHttpServer())
      .get('/compatibility/error')
      .expect(400)
      .expect({
        statusCode: 400,
        message: 'Expected validation error',
        error: 'Bad Request',
      });
  });

  it('serves Swagger UI and an OpenAPI schema generated from decorators', async () => {
    await request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('content-type', /text\/html/);

    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);

    expect(response.body.openapi).toBe('3.0.0');
    expect(response.body.paths).toHaveProperty('/compatibility/validate');
    expect(response.body.components.schemas).toHaveProperty(
      CompatibilityRequest.name,
    );
  });

  it('retains public-route bypass and JWT authentication behavior', async () => {
    await request(app.getHttpServer()).get('/compatibility/query').expect(200);
    await request(app.getHttpServer())
      .get('/compatibility/protected')
      .expect(401);

    const token = jwtService.sign({
      sub: '0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
    });

    await request(app.getHttpServer())
      .get('/compatibility/protected')
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' });
  });

  it('continues to emit permissive CORS headers', async () => {
    await request(app.getHttpServer())
      .options('/compatibility/validate')
      .set('origin', 'https://example.test')
      .set('access-control-request-method', 'POST')
      .expect(204)
      .expect('access-control-allow-origin', '*');
  });

  it('serves API Gateway v1 events through the maintained Lambda adapter', async () => {
    const adapter = serverlessExpress({
      app: app.getHttpAdapter().getInstance(),
    }) as unknown as (
      event: unknown,
      context: Context,
    ) => Promise<{ statusCode: number; body: string }>;
    const response = await adapter(
      {
        body: null,
        headers: {},
        httpMethod: 'GET',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: { tag: ['lambda'] },
        path: '/compatibility/query',
        pathParameters: null,
        queryStringParameters: { tag: 'lambda' },
        requestContext: {},
        resource: '/{proxy+}',
        stageVariables: null,
      },
      {} as Context,
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ tags: 'lambda' });
  });
});
