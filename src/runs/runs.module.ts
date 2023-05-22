import { AllowlistLibModule } from '../allowlist-lib/allowlist-lib.module';
import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { RunsService } from './runs.service';
import { RunnerProxy } from './runner-proxy';

@Module({
  imports: [RepositoriesModule, AllowlistLibModule],
  providers: [RunsService, RunnerProxy],
  exports: [RunnerProxy],
})
export class RunsModule {}
