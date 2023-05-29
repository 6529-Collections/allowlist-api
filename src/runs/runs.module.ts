import { AllowlistLibModule } from '../allowlist-lib/allowlist-lib.module';
import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { RunsService } from './runs.service';
import { RunnerProxy } from './runner-proxy';
import { SnsModule } from '../sns/sns.module';

@Module({
  imports: [RepositoriesModule, AllowlistLibModule, SnsModule],
  providers: [RunsService, RunnerProxy],
  exports: [RunnerProxy],
})
export class RunsModule {}
