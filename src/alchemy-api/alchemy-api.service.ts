import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
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

interface CanonicalContractMetadata {
  id: string;
  address: string;
  name: string;
  tokenType: string;
  imageUrl: string;
  description: string;
}

const MEMES_CONTRACT_ADDRESS = '0x33fd426905f149f8376e227d0c9d3340aad17af1';
const MEME_LAB_CONTRACT_ADDRESS = '0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb';
const GRADIENT_CONTRACT_ADDRESS = '0x0c58ef43ff3032005e472cb5709f8908acb00205';
const RAW_CONTRACT_ADDRESS = '0x07e24ee32163da59297b5341bef8f8a2eead271e';

const CANONICAL_CONTRACT_METADATA: Record<string, CanonicalContractMetadata> = {
  [MEMES_CONTRACT_ADDRESS]: {
    id: MEMES_CONTRACT_ADDRESS,
    address: MEMES_CONTRACT_ADDRESS,
    name: 'The Memes by 6529',
    tokenType: 'ERC1155',
    imageUrl: 'https://6529.io/memes-preview.png',
    description:
      'The Memes Collection is focused on the fight for the open metaverse (decentralization, community, self-sovereignty) and spreading this message to many people, many wallets.\n\nIt is a collection that is meant to be open and accessible. Edition sizes will generally be large and inexpensive, to spread the word and to avoid gas wars.\n\nWe will try to have a good time along the way, make some fun art, do great collabs and just generally have a good time.\n\nFor more information visit https://6529.io/about/the-memes',
  },
  [MEME_LAB_CONTRACT_ADDRESS]: {
    id: MEME_LAB_CONTRACT_ADDRESS,
    address: MEME_LAB_CONTRACT_ADDRESS,
    name: 'Meme Lab',
    tokenType: 'ERC1155',
    imageUrl:
      'https://i2c.seadn.io/ethereum/35e37c625ffb45f3a5e669d5b267a1ad/dd9de48b32f23da6535a028f1d8c36/d1dd9de48b32f23da6535a028f1d8c36.jpeg',
    description:
      'Meme Lab is a collection for [The Memes by 6529](https://opensea.io/collection/thememes6529) artists to run whatever experiments they like',
  },
  [GRADIENT_CONTRACT_ADDRESS]: {
    id: GRADIENT_CONTRACT_ADDRESS,
    address: GRADIENT_CONTRACT_ADDRESS,
    name: '6529 Gradient',
    tokenType: 'ERC721',
    imageUrl:
      'https://i2c.seadn.io/ethereum/9415f36597d64ab9be239e0c818430d4/dfbae56955745a231e038d7ad712ac/0fdfbae56955745a231e038d7ad712ac.png',
    description:
      "The 6529 Gradient Collection represents the 6529 symbol in its original two stark black and white forms as well 98 grayscale gradients in-between.\n\nIt is the artist's (@6529er) preferred interpretation and genesis drop of his work.\n\nEach of the 100 pieces is represented as a 100% on-chain SVG with a secondary IPFS link.\n\nThe 101st piece is Gradient #50 which is a special GIF – it moves!\n\nAs always, 6529 fam fights for an Open Metaverse",
  },
  [RAW_CONTRACT_ADDRESS]: {
    id: RAW_CONTRACT_ADDRESS,
    address: RAW_CONTRACT_ADDRESS,
    name: '6529 RAW',
    tokenType: 'ERC721',
    imageUrl:
      'https://i2c.seadn.io/ethereum/37e7c49010bc4d2ea70fe6908c0659a4/30ad5c9e46fc60931cb68ae69e36ea/3b30ad5c9e46fc60931cb68ae69e36ea.png',
    description:
      "6529 Raw is 6529's CC0 personal photography collection.\n\nFor more information: https://6529.io/collections/6529raw/",
  },
};
// These exact provider sentinel values are treated as absent only after the
// response has been gated to a contract with canonical metadata.
const CONTRACT_METADATA_PLACEHOLDERS = new Set(['n/a', 'unknown']);

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
    const canonicalMetadata = this.findCanonicalMetadata(address);
    let metadata;
    try {
      metadata = await this.alchemy.nft.getContractMetadata(address);
    } catch (error) {
      if (!canonicalMetadata) {
        throw error;
      }
      return this.getCanonicalFallback(canonicalMetadata, 'provider-error');
    }
    if (!metadata) {
      if (!canonicalMetadata) {
        return null;
      }
      return this.getCanonicalFallback(canonicalMetadata, 'provider-empty');
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
    const canonicalMetadata = this.findCanonicalMetadata(metadata.address);
    if (!canonicalMetadata) {
      return metadata;
    }

    const fallbackFields: string[] = [];
    const name = this.withCanonicalFallback(
      metadata.name,
      canonicalMetadata.name,
      'name',
      fallbackFields,
    );
    const tokenType = this.withCanonicalFallback(
      metadata.tokenType,
      canonicalMetadata.tokenType,
      'tokenType',
      fallbackFields,
    );
    const imageUrl = this.withCanonicalFallback(
      metadata.imageUrl,
      canonicalMetadata.imageUrl,
      'imageUrl',
      fallbackFields,
    );
    const description = this.withCanonicalFallback(
      metadata.description,
      canonicalMetadata.description,
      'description',
      fallbackFields,
    );

    const usedFallback = fallbackFields.length > 0;
    if (usedFallback) {
      this.logCanonicalFallback(metadata.address, fallbackFields);
    }

    return {
      ...metadata,
      ...(usedFallback
        ? {
            id: canonicalMetadata.id,
            address: canonicalMetadata.address,
          }
        : {}),
      name,
      tokenType,
      imageUrl,
      description,
    };
  }

  private findCanonicalMetadata(
    address: string,
  ): CanonicalContractMetadata | null {
    return CANONICAL_CONTRACT_METADATA[address.toLowerCase()] ?? null;
  }

  private getCanonicalFallback(
    canonicalMetadata: CanonicalContractMetadata,
    reason: 'provider-error' | 'provider-empty',
  ): ContractMetadataResponse {
    this.logCanonicalFallback(canonicalMetadata.address, [
      reason,
      'name',
      'tokenType',
      'imageUrl',
      'description',
    ]);
    return {
      ...canonicalMetadata,
      openseaVerified: false,
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
