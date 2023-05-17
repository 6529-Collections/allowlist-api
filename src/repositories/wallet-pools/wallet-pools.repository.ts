import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WalletPoolModel } from './wallet-pool.model';
import { Model } from 'mongoose';
import { WalletPoolDto } from './wallet-pool.dto';

@Injectable()
export class WalletPoolsRepository {
  constructor(
    @InjectModel(WalletPoolModel.name)
    private readonly walletPoolModel: Model<WalletPoolModel>,
  ) {}

  private mapModelToDto(model: WalletPoolModel): WalletPoolDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      walletPoolId: model.walletPoolId,
      activeRunId: model.activeRunId,
      name: model.name,
      description: model.description,
    };
  }

  async getByAllowlistId(allowlistId: string): Promise<WalletPoolDto[]> {
    const models = await this.walletPoolModel.find({ allowlistId });
    return models.map((model) => this.mapModelToDto(model));
  }

  async getAllowlistWalletPool(param: {
    allowlistId: string;
    walletPoolId: string;
  }): Promise<WalletPoolDto | null> {
    const { allowlistId, walletPoolId } = param;
    const model = await this.walletPoolModel.findOne({
      walletPoolId,
      allowlistId,
    });
    return model ? this.mapModelToDto(model) : null;
  }

  async createMany(walletPools: Omit<WalletPoolDto, 'id'>[]): Promise<void> {
    await this.walletPoolModel.insertMany(walletPools, {
      ordered: false,
    });
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.walletPoolModel.deleteMany({ allowlistId });
  }
}
