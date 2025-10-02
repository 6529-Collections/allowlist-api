import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Alchemy, OpenSeaSafelistRequestStatus } from 'alchemy-sdk';
import { AlchemyConfig } from './alchemy.config';

export interface ContractMetadataResponse {
  id: string;
  address: string;
  name: string;
  tokenType: string;
  imageUrl?: string | null;
  description?: string | null;
  openseaVerified: boolean;
}

@Injectable()
export class AlchemyApiService {
  private readonly BASE_URI = 'https://eth-mainnet.g.alchemy.com/';
  private readonly HEADERS = {
    accept: '*/*',
  };

  constructor(
    private readonly alchemy: Alchemy,
    private readonly alchemyConfig: AlchemyConfig,
    private readonly httpService: HttpService,
  ) {}

  async getContractMetadata(
    address: string,
  ): Promise<ContractMetadataResponse | null> {
    const metadata = await this.alchemy.nft.getContractMetadata(address);
    if (!metadata) {
      return null;
    }
    return {
      id: address,
      address,
      name: metadata.name ?? metadata.openSea?.collectionName ?? 'N/A',
      tokenType: metadata.tokenType ?? 'N/A',
      description: metadata.openSea?.description ?? 'N/A',
      imageUrl: metadata.openSea?.imageUrl ?? null,
      openseaVerified:
        metadata.openSea?.safelistRequestStatus ===
        OpenSeaSafelistRequestStatus.VERIFIED,
    };
  }

  public async getBlockNumber(): Promise<number> {
    return await this.alchemy.core.getBlockNumber();
  }

  public async resolveEnsToAddress(ens: string): Promise<string | null> {
    const address = await this.alchemy.core.resolveName(ens);
    return address?.toLowerCase() ?? null;
  }

  /**
   * Warning: This is terrible performing approach since you need to do a lot of calls to index one whole collection.
   * Prefer Transpose API for this
   */
  public async getContractTokenIds({
    address,
    continuation,
  }: {
    address: string;
    continuation: string | null;
  }): Promise<{ tokens: string[]; continuation: string | null }> {
    const url = `${this.BASE_URI}nft/v3/${this.alchemyConfig.key}/getNFTsForContract`;
    return await this.alchemyGet<{
      nfts: { tokenId: string }[];
    }>(url, {
      withMetadata: 'false',
      contractAddress: address,
      startToken: continuation ?? undefined,
    }).then((response) => ({
      tokens: response.nfts.map((nft) => nft.tokenId),
      continuation: response.nfts.at(-1)?.tokenId
        ? `${parseInt(response.nfts.at(-1)?.tokenId) + 1}`
        : null,
    }));
  }

  private async alchemyGet<T>(
    url: string,
    queryParams: Record<string, string>,
  ): Promise<T> {
    const { data } = await this.httpService.axiosRef.get<T>(url, {
      params: queryParams,
      headers: this.HEADERS,
    });
    return data;
  }

  async searchContractMetadata(
    kw: string,
  ): Promise<ContractMetadataResponse[]> {
    const contracts = await this.alchemy.nft.searchContractMetadata(kw);

    return contracts.map((metadata) => ({
      id: metadata.address,
      address: metadata.address,
      name: metadata?.name ?? 'N/A',
      tokenType: metadata?.tokenType ?? 'N/A',
      description: metadata?.openSea?.description ?? 'N/A',
      imageUrl: metadata?.openSea?.imageUrl ?? null, // optional
      openseaVerified:
        metadata?.openSea?.safelistRequestStatus ===
        OpenSeaSafelistRequestStatus.VERIFIED,
    }));
  }
}
