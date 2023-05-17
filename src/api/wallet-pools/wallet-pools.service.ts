import { BadRequestException, Injectable } from '@nestjs/common';
import { WalletPoolsRepository } from '../../repositories/wallet-pools/wallet-pools.repository';
import { WalletPoolResponseApiModel } from './models/wallet-pool-response-api.model';

@Injectable()
export class WalletPoolsService {
  constructor(private readonly walletPoolsRepository: WalletPoolsRepository) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<WalletPoolResponseApiModel[]> {
    return this.walletPoolsRepository.getByAllowlistId(allowlistId);
  }

  async getWalletPool(param: {
    allowlistId: string;
    walletPoolId: string;
  }): Promise<WalletPoolResponseApiModel> {
    const { allowlistId, walletPoolId } = param;
    const walletPool = this.walletPoolsRepository.getAllowlistWalletPool({
      allowlistId,
      walletPoolId,
    });
    if (!walletPool) {
      throw new BadRequestException('Wallet pool not found');
    }
    return walletPool;
  }
}
