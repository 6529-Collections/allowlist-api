import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../repository/repository.module';
import { OtherController } from './other.controller';
import { OtherService } from './other.service';
import { AlchemyApiModule } from '../../alchemy-api/alchemy-api.module';
import { SeizeApiModule } from '../../seize-api/seize-api.module';
import { EtherscanApiModule } from '../../etherscan-api/etherscan-api.module';
import { TransposeApiModule } from '../../transpose-api/transpose-api.module';

@Module({
  imports: [
    RepositoryModule,
    AlchemyApiModule,
    TransposeApiModule,
    EtherscanApiModule,
    SeizeApiModule,
  ],
  controllers: [OtherController],
  providers: [OtherService],
})
export class OtherModule {}
