import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TransferPoolModel } from './transfer-pool.model';
import { Model } from 'mongoose';
import { TransferPoolDto } from './transfer-pool.dto';

@Injectable()
export class TransferPoolsRepository {
  constructor(
    @InjectModel(TransferPoolModel.name)
    private readonly transferPoolModel: Model<TransferPoolModel>,
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

  async getByAllowlistId(allowlistId: string): Promise<TransferPoolDto[]> {
    const models = await this.transferPoolModel.find({ allowlistId });
    return models.map((model) => this.mapModelToDto(model));
  }

  async getAllowlistTransferPool(param: {
    allowlistId: string;
    transferPoolId: string;
  }): Promise<TransferPoolDto | null> {
    const { allowlistId, transferPoolId } = param;
    const model = await this.transferPoolModel.findOne({
      transferPoolId,
      allowlistId,
    });
    return model ? this.mapModelToDto(model) : null;
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.transferPoolModel.deleteMany({ allowlistId });
  }

  async createMany(
    transferPools: Omit<TransferPoolDto, 'id'>[],
  ): Promise<void> {
    await this.transferPoolModel.insertMany(transferPools, {
      ordered: false,
    });
  }
}
