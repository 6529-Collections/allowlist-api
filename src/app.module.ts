import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AllowlistLibModule } from './allowlist-lib/allowlist-lib.module';
import { ApiModule } from './api/api.module';
import { RunnerModule } from './runner/runner.module';
import { OtherModule } from './api/other/other.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ApiModule,
    AllowlistLibModule,
    RunnerModule,
    OtherModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
