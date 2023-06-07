import { AllowlistLibModule } from '../allowlist-lib/allowlist-lib.module';
import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { RunnerService } from './runner.service';
import { RunnerProxy } from './runner.proxy';
import { SnsModule } from '../sns/sns.module';

@Module({
  imports: [RepositoryModule, AllowlistLibModule, SnsModule],
  providers: [RunnerService, RunnerProxy],
  exports: [RunnerProxy],
})
export class RunnerModule {}
