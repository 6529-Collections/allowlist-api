import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TransferPoolModel } from './transfer-pool.model';
import { ClientSession, Model } from 'mongoose';
import { TransferPoolDto } from './transfer-pool.dto';

@Injectable()
export class TransferPoolsRepository {
  constructor(
    @InjectModel(TransferPoolModel.name)
    private readonly transferPoolMoldel: Model<TransferPoolModel>,
  ) {}

  private mapModelToDto(model: TransferPoolModel): TransferPoolDto {
    return {
      id: model._id.toString(),
      transferPoolId: model.transferPoolId,
      allowlistId: model.allowlistId,
      name: model.name,
      description: model.description,
      blockNo: model.blockNo,
      contract: model.contract,
      activeRunId: model.activeRunId,
    };
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.transferPoolMoldel.deleteMany({ allowlistId });
  }

  async createMany(
    transferPools: Omit<TransferPoolDto, 'id'>[],
  ): Promise<void> {
    await this.transferPoolMoldel.insertMany(transferPools, {
      ordered: false,
    });
  }
}
