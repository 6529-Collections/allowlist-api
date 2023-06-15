import { BadRequestException, Injectable } from '@nestjs/common';
import { WalletPoolRepository } from '../../repository/wallet-pool/wallet-pool.repository';
import { WalletPoolResponseApiModel } from './model/wallet-pool-response-api.model';
import { WalletPoolEntity } from '../../repository/wallet-pool/wallet-pool.entity';

@Injectable()
export class WalletPoolService {
  constructor(private readonly walletPoolRepository: WalletPoolRepository) {}

  private entityToApiModel(
    entity: WalletPoolEntity,
  ): WalletPoolResponseApiModel {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      allowlistId: entity.allowlist_id,
      walletsCount: entity.wallets_count,
    };
  }

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<WalletPoolResponseApiModel[]> {
    const entities = await this.walletPoolRepository.getByAllowlistId(
      allowlistId,
    );
    return entities.map(this.entityToApiModel);
  }

  async getWalletPool(param: {
    allowlistId: string;
    walletPoolId: string;
  }): Promise<WalletPoolResponseApiModel> {
    const { allowlistId, walletPoolId } = param;
    const walletPool = await this.walletPoolRepository.getAllowlistWalletPool({
      allowlistId,
      walletPoolId,
    });
    if (!walletPool) {
      throw new BadRequestException('Wallet pool not found');
    }
    return this.entityToApiModel(walletPool);
  }
}
