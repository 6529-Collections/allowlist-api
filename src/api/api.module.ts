import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AllowlistsController } from './allowlist/allowlists.controller';
import { AllowlistOperationsService } from './operations/allowlist-operations.service';
import { AllowlistOperationsController } from './operations/allowlist-operations.controller';
import { AllowlistLibModule } from '../allowlist-lib/allowlist-lib.module';
import { AllowlistsService } from './allowlist/allowlists.service';
import { AllowlistRunsService } from './runs/allowlist-runs.service';
import { AllowlistRunsController } from './runs/allowlist-runs.controller';
// Placeholder for future imports, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE

@Module({
  imports: [RepositoriesModule, AllowlistLibModule],
  providers: [
    AllowlistOperationsService,
    AllowlistsService,
    AllowlistRunsService,
    // Placeholder for future services, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE
  ],
  controllers: [
    AllowlistsController,
    AllowlistOperationsController,
    AllowlistRunsController,
    // Placeholder for future controllers, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE
  ],
})
export class ApiModule {}
