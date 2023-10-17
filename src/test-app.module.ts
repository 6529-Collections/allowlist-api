import { Module } from '@nestjs/common';
import { SentryModule } from './sentry/sentry.module';

@Module({
  imports: [SentryModule.forRoot()],
  controllers: [],
})
export class TestAppModule {}
