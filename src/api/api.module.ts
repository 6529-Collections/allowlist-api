import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AllowlistsController } from './allowlist/allowlists.controller';
import { AllowlistOperationsService } from './operations/allowlist-operations.service';
import { AllowlistOperationsController } from './operations/allowlist-operations.controller';
import { AllowlistLibModule } from '../allowlist-lib/allowlist-lib.module';
import { AllowlistsService } from './allowlist/allowlists.service';
import { AllowlistRunsService } from './runs/allowlist-runs.service';
import { AllowlistRunsController } from './runs/allowlist-runs.controller';

@Module({
  imports: [RepositoriesModule, AllowlistLibModule],
  providers: [
    AllowlistOperationsService,
    AllowlistsService,
    AllowlistRunsService,
  ],
  controllers: [
    AllowlistsController,
    AllowlistOperationsController,
    AllowlistRunsController,
  ],
})
export class ApiModule {}
