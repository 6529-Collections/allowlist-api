import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../repository/repository.module';
import { OtherController } from './other.controller';
import { OtherService } from './other.service';

@Module({
  imports: [RepositoryModule],
  controllers: [OtherController],
  providers: [OtherService],
})
export class OtherModule {}
