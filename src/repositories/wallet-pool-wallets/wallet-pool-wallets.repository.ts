import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WalletPoolWalletModel } from './wallet-pool-wallet.model';
import { Model } from 'mongoose';
import { WalletPoolWalletDto } from './wallet-pool-wallet.dto';

@Injectable()
export class WalletPoolWalletsRepository {
  constructor(
    @InjectModel(WalletPoolWalletModel.name)
    private readonly walletPoolWalletModel: Model<WalletPoolWalletModel>,
  ) {}

  private mapModelToDto(model: WalletPoolWalletModel): WalletPoolWalletDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      activeRunId: model.activeRunId,
      walletPoolId: model.walletPoolId,
      wallet: model.wallet,
    };
  }

  async createMany(
    walletPoolWallets: Omit<WalletPoolWalletDto, 'id'>[],
  ): Promise<void> {
    await this.walletPoolWalletModel.insertMany(walletPoolWallets, {
      ordered: false,
    });
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.walletPoolWalletModel.deleteMany({ allowlistId });
  }
}
