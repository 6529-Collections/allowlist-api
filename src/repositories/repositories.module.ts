import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransferModel, TransferSchema } from './transfer/transfer.model';
import { TransferRepository } from './transfer/transfer.repository';
import {
  AllowlistModel,
  AllowlistRequestSchema,
} from './allowlist/allowlist.model';
import { AllowlistsRepository } from './allowlist/allowlists.repository';
import {
  AllowlistOperationModel,
  AllowlistOperationSchema,
} from './allowlist-operations/allowlist-operation.model';
import { AllowlistOperationsRepository } from './allowlist-operations/allowlist-operations.repository';

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
      {
        name: AllowlistOperationModel.name,
        schema: AllowlistOperationSchema,
      },
    ]),
  ],
  providers: [
    TransferRepository,
    AllowlistsRepository,
    AllowlistOperationsRepository,
  ],
  exports: [
    TransferRepository,
    AllowlistsRepository,
    AllowlistOperationsRepository,
  ],
})
export class RepositoriesModule {}
