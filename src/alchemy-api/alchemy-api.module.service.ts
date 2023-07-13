import { Inject, Injectable } from '@nestjs/common';
import { Alchemy, NftContract } from 'alchemy-sdk';

@Injectable()
export class AlchemyApiService {
  constructor(@Inject(Alchemy.name) private readonly alchemy: Alchemy) {}

  async searchContractMetadata(kw: string): Promise<NftContract[]> {
    return await this.alchemy.nft.searchContractMetadata(kw);
  }

  async getBlockNumber(): Promise<number> {
    return await this.alchemy.core.getBlockNumber();
  }
}
