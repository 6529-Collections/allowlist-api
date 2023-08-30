import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EtherscanApiService } from './etherscan-api.service';

@Module({
  imports: [HttpModule],
  providers: [EtherscanApiService],
  exports: [EtherscanApiService],
})
export class EtherscanApiModule {}
