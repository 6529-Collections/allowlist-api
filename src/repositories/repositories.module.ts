import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransferModel, TransferSchema } from './transfer/transfer.model';
import { TransferRepository } from './transfer/transfer.repository';
import {
  AllowlistModel,
  AllowlistRequestSchema,
} from './allowlist/allowlist.model';
import { AllowlistRequestRepository } from './allowlist/allowlist-request.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TransferModel.name,
        schema: TransferSchema,
      },
      {
        name: AllowlistModel.name,
        schema: AllowlistRequestSchema,
      },
    ]),
  ],
  providers: [TransferRepository, AllowlistRequestRepository],
  exports: [TransferRepository, AllowlistRequestRepository],
})
export class RepositoriesModule {}
