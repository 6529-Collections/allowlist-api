import { Module } from '@nestjs/common';
import { SeizeApiService } from './seize-api.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [SeizeApiService],
  exports: [SeizeApiService],
})
export class SeizeApiModule {}
