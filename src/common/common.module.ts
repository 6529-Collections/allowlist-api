import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { CommonService } from './common.service';

@Module({
  imports: [RepositoriesModule],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
