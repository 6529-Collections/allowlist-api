import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AllowlistLibModule } from './allowlist-lib/allowlist-lib.module';
import { ApiModule } from './api/api.module';
import { RunnerModule } from './runner/runner.module';
import { OtherModule } from './api/other/other.module';
import { TokenPoolModule } from './token-pool/token-pool.module';
import { ScheduleModule } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';
import { SentryModule } from './sentry/sentry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ApiModule,
    AllowlistLibModule,
    RunnerModule,
    TokenPoolModule,
    OtherModule,
    SentryModule.forRoot(),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
