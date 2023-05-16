import { AllowlistLibModule } from './../allowlist-lib/allowlist-lib.module';
import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { RunsService } from './runs.service';

@Module({
  imports: [RepositoriesModule, AllowlistLibModule],
  providers: [RunsService],
})
export class RunsModule {}
