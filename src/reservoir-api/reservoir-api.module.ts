import { Module } from '@nestjs/common';
import { ReservoirApiService } from './reservoir-api.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ReservoirApiService],
  exports: [ReservoirApiService],
})
export class ReservoirApiModule {}
