import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryApiInterceptor } from './sentry-api-interceptor.service';

@Module({
  providers: [],
})
export class SentryModule {
  static forRoot() {
    return {
      module: SentryModule,
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: SentryApiInterceptor,
        },
      ],
    };
  }
}
