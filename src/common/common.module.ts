import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { CommonService } from './common.service';

@Module({
  imports: [RepositoryModule],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
