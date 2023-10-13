import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryService } from './sentry.service';
import { SentryInterceptor } from './sentry.interceptor';

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
          useClass: SentryInterceptor,
        },
      ],
      exports: [SentryService],
    };
  }
}
