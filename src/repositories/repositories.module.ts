import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransferModel, TransferSchema } from './transfer/transfer.model';
import { TransferRepository } from './transfer/transfer.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TransferModel.name,
        schema: TransferSchema,
      },
    ]),
  ],
  providers: [TransferRepository],
  exports: [TransferRepository],
})
export class RepositoriesModule {}
