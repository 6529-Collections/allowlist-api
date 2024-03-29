import { Injectable } from '@nestjs/common';
import { Alchemy } from 'alchemy-sdk';

@Injectable()
export class AlchemyApiService {
  constructor(private readonly alchemy: Alchemy) {}

  async getBlockNumber(): Promise<number> {
    return await this.alchemy.core.getBlockNumber();
  }

  public async resolveEnsToAddress(ens: string): Promise<string | null> {
    const address = await this.alchemy.core.resolveName(ens);
    return address?.toLowerCase() ?? null;
  }

  public async resolveAddressToEns(address: string): Promise<string> {
    return this.alchemy.core.lookupAddress(address);
  }
}
