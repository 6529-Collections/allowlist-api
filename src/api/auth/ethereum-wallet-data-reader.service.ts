import { Injectable } from '@nestjs/common';

@Injectable()
export class EthereumWalletDataReaderService {
  async getWalletData({
    wallet,
  }: {
    wallet: string;
  }): Promise<{ tokenId: string; role: number } | null> {
    return { tokenId: '1', role: 1 };
  }
}
