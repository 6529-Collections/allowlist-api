import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AllowlistLibModule } from './allowlist-lib/allowlist-lib.module';
import { RunnerModule } from './runner/runner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AllowlistLibModule,
    RunnerModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class WorkerModule {}
