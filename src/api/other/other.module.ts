import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { OtherController } from './other.controller';
import { OtherService } from './other.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [OtherController],
  providers: [OtherService],
})
export class OtherModule {}
