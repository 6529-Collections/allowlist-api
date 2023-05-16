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
