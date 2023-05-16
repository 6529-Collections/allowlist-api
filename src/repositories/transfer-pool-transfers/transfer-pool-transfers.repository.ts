import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import e from 'express';
import { TransferPoolTransferModel } from './transfer-pool-transfer.model';
import { ClientSession, Model } from 'mongoose';
import { TransferPoolTransferDto } from './transfer-pool-transfer.dto';

@Injectable()
export class TransferPoolTransfersRepository {
  constructor(
    @InjectModel(TransferPoolTransferModel.name)
    private readonly transferPoolTransfers: Model<TransferPoolTransferModel>,
  ) {}

  private mapModelToDto(
    model: TransferPoolTransferModel,
  ): TransferPoolTransferDto {
    return {
      id: model._id.toString(),
      transferPoolId: model.transferPoolId,
      allowlistId: model.allowlistId,
      activeRunId: model.activeRunId,
      order: model.order,
      contract: model.contract,
      tokenID: model.tokenID,
      blockNumber: model.blockNumber,
      timeStamp: model.timeStamp,
      logIndex: model.logIndex,
      from: model.from,
      to: model.to,
      amount: model.amount,
      transactionHash: model.transactionHash,
      transactionIndex: model.transactionIndex,
    };
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.transferPoolTransfers.deleteMany({ allowlistId });
  }

  async createMany(
    transferPoolTransfers: Omit<TransferPoolTransferDto, 'id'>[],
  ): Promise<void> {
    await this.transferPoolTransfers.insertMany(transferPoolTransfers, {
      ordered: false,
    });
  }
}
