import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../repository/repository.module';
import { OtherController } from './other.controller';
import { OtherService } from './other.service';
import { AlchemyApiModule } from '../../alchemy-api/alchemy-api.module';
import { ReservoirApiModule } from '../../reservoir-api/reservoir-api.module';

@Module({
  imports: [RepositoryModule, AlchemyApiModule, ReservoirApiModule],
  controllers: [OtherController],
  providers: [OtherService],
})
export class OtherModule {}
