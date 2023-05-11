import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AllowlistController } from './allowlist-controller';

@Module({
  imports: [RepositoriesModule],
  controllers: [AllowlistController],
})
export class ApiModule {}
