import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Alchemy, OpenSeaSafelistRequestStatus } from 'alchemy-sdk';
import { AlchemyConfig } from './alchemy.config';

const MEMES_CONTRACT_ADDRESS = '0x33fd426905f149f8376e227d0c9d3340aad17af1';
const MEMES_CANONICAL_METADATA = {
  id: MEMES_CONTRACT_ADDRESS,
  address: MEMES_CONTRACT_ADDRESS,
  name: 'The Memes by 6529',
  tokenType: 'ERC1155',
  imageUrl: 'https://6529.io/memes-preview.png',
  description:
    'The Memes Collection is focused on the fight for the open metaverse (decentralization, community, self-sovereignty) and spreading this message to many people, many wallets.\n\nIt is a collection that is meant to be open and accessible. Edition sizes will generally be large and inexpensive, to spread the word and to avoid gas wars.\n\nWe will try to have a good time along the way, make some fun art, do great collabs and just generally have a good time.\n\nFor more information visit https://6529.io/about/the-memes',
} as const;
const CONTRACT_METADATA_PLACEHOLDERS = new Set(['n/a', 'unknown']);

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
  private readonly logger = new Logger(AlchemyApiService.name);
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
    let metadata;
    try {
      metadata = await this.alchemy.nft.getContractMetadata(address);
    } catch (error) {
      if (address.toLowerCase() !== MEMES_CONTRACT_ADDRESS) {
        throw error;
      }
      this.logCanonicalFallback(address, [
        'provider-error',
        'name',
        'tokenType',
        'imageUrl',
        'description',
      ]);
      return {
        ...MEMES_CANONICAL_METADATA,
        openseaVerified: false,
      };
    }
    if (!metadata) {
      if (address.toLowerCase() !== MEMES_CONTRACT_ADDRESS) {
        return null;
      }
      this.logCanonicalFallback(address, [
        'provider-empty',
        'name',
        'tokenType',
        'imageUrl',
        'description',
      ]);
      return {
        ...MEMES_CANONICAL_METADATA,
        openseaVerified: false,
      };
    }
    return this.applyCanonicalFallback({
      id: address,
      address,
      name: metadata.name ?? metadata.openSea?.collectionName ?? 'N/A',
      tokenType: metadata.tokenType ?? 'N/A',
      description: metadata.openSea?.description ?? 'N/A',
      imageUrl: metadata.openSea?.imageUrl ?? null,
      openseaVerified:
        metadata.openSea?.safelistRequestStatus ===
        OpenSeaSafelistRequestStatus.VERIFIED,
    });
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

    return contracts.map((metadata) =>
      this.applyCanonicalFallback({
        id: metadata.address,
        address: metadata.address,
        name: metadata?.name ?? 'N/A',
        tokenType: metadata?.tokenType ?? 'N/A',
        description: metadata?.openSea?.description ?? 'N/A',
        imageUrl: metadata?.openSea?.imageUrl ?? null, // optional
        openseaVerified:
          metadata?.openSea?.safelistRequestStatus ===
          OpenSeaSafelistRequestStatus.VERIFIED,
      }),
    );
  }

  private applyCanonicalFallback(
    metadata: ContractMetadataResponse,
  ): ContractMetadataResponse {
    if (metadata.address.toLowerCase() !== MEMES_CONTRACT_ADDRESS) {
      return metadata;
    }

    const fallbackFields: string[] = [];
    const name = this.withCanonicalFallback(
      metadata.name,
      MEMES_CANONICAL_METADATA.name,
      'name',
      fallbackFields,
    );
    const tokenType = this.withCanonicalFallback(
      metadata.tokenType,
      MEMES_CANONICAL_METADATA.tokenType,
      'tokenType',
      fallbackFields,
    );
    const imageUrl = this.withCanonicalFallback(
      metadata.imageUrl,
      MEMES_CANONICAL_METADATA.imageUrl,
      'imageUrl',
      fallbackFields,
    );
    const description = this.withCanonicalFallback(
      metadata.description,
      MEMES_CANONICAL_METADATA.description,
      'description',
      fallbackFields,
    );

    if (fallbackFields.length) {
      this.logCanonicalFallback(metadata.address, fallbackFields);
    }

    return {
      ...metadata,
      id: MEMES_CANONICAL_METADATA.id,
      address: MEMES_CANONICAL_METADATA.address,
      name,
      tokenType,
      imageUrl,
      description,
    };
  }

  private withCanonicalFallback(
    value: string | null | undefined,
    fallback: string,
    field: string,
    fallbackFields: string[],
  ): string {
    if (
      !value?.trim() ||
      CONTRACT_METADATA_PLACEHOLDERS.has(value.trim().toLowerCase())
    ) {
      fallbackFields.push(field);
      return fallback;
    }
    return value;
  }

  private logCanonicalFallback(address: string, fields: string[]): void {
    this.logger.warn(
      `[CONTRACT_METADATA_CANONICAL_FALLBACK] address=${address.toLowerCase()} fields=${fields.join(
        ',',
      )}`,
    );
  }
}
