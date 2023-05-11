import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AllowlistsController } from './allowlists.controller';
import { AllowlistOperationsService } from './services/allowlist-operations.service';
import { AllowlistOperationsController } from './allowlist-operations.controller';

@Module({
  imports: [RepositoriesModule],
  providers: [AllowlistOperationsService],
  controllers: [AllowlistsController, AllowlistOperationsController],
})
export class ApiModule {}
