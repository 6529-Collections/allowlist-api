import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryService } from './sentry.service';
import { SentryApiInterceptor } from './sentry-api-interceptor.service';

@Module({
  providers: [SentryService],
})
export class SentryModule {
  static forRoot() {
    return {
      module: SentryModule,
      providers: [
        SentryService,
        {
          provide: APP_INTERCEPTOR,
          useClass: SentryApiInterceptor,
        },
      ],
      exports: [SentryService],
    };
  }
}
