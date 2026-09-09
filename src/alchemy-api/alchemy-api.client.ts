import { HttpService } from '@nestjs/axios';
import {
  AlchemyClient as AllowlistAlchemyClient,
  AlchemyOwnersOptions,
  AlchemyOwnersResponse,
} from '@6529-collections/allowlist-lib';
import axios from 'axios';
import { isError } from 'ethers';
import {
  getProviderRequestId,
  sanitizeProviderMessage,
  UpstreamProviderError,
  UpstreamProviderFailureKind,
} from '../common/upstream-provider.error';
import { AlchemyConfig } from './alchemy.config';

const OPENSEA_SAFELIST_STATUSES = new Set([
  'verified',
  'approved',
  'requested',
  'not_requested',
]);

const MAX_HTTP_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY_MS = 1_000;
const RETRY_MULTIPLIER = 1.5;

export interface AlchemyJsonRpcProvider {
  getBlockNumber(): Promise<number>;
  resolveName(name: string): Promise<string | null>;
  lookupAddress(address: string): Promise<string | null>;
}

export interface AlchemyOpenSeaMetadata {
  collectionName?: string;
  safelistRequestStatus?: string;
  imageUrl?: string;
  description?: string;
}

export interface AlchemyContractMetadata {
  address: string;
  name?: string;
  tokenType?: string;
  openSea?: AlchemyOpenSeaMetadata;
}

type RawOpenSeaMetadata = AlchemyOpenSeaMetadata;

interface RawV2ContractMetadata {
  address: string;
  contractMetadata?: {
    name?: string;
    tokenType?: string;
    openSea?: RawOpenSeaMetadata;
    opensea?: RawOpenSeaMetadata;
  };
}

interface RawV3ContractMetadata {
  address: string;
  name?: string;
  tokenType?: string;
  openseaMetadata?: RawOpenSeaMetadata;
}

interface RawOwnersResponse {
  ownerAddresses: AlchemyOwnersResponse['owners'];
  pageKey?: string;
}

interface RawContractTokensResponse {
  nfts: { tokenId: string }[];
  pageKey?: string | null;
}

export class AlchemyApiClient implements AllowlistAlchemyClient {
  private readonly nftV2BaseUrl: string;
  private readonly nftV3BaseUrl: string;

  readonly nft = {
    getOwnersForContract: (
      contractAddress: string,
      options: AlchemyOwnersOptions,
    ): Promise<AlchemyOwnersResponse> =>
      this.getOwnersForContract(contractAddress, options),
  };

  readonly core = {
    resolveName: (name: string): Promise<string | null> =>
      this.resolveName(name),
    lookupAddress: (address: string): Promise<string | null> =>
      this.provider.lookupAddress(address),
  };

  constructor(
    alchemyConfig: AlchemyConfig,
    private readonly httpService: HttpService,
    private readonly provider: AlchemyJsonRpcProvider,
  ) {
    const encodedApiKey = encodeURIComponent(alchemyConfig.key);
    // Keyword search and historical owner snapshots still use the v2 contracts;
    // maintained metadata and token-list operations use v3.
    this.nftV2BaseUrl = `https://eth-mainnet.g.alchemy.com/nft/v2/${encodedApiKey}`;
    this.nftV3BaseUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${encodedApiKey}`;
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  private async resolveName(name: string): Promise<string | null> {
    try {
      return await this.provider.resolveName(name);
    } catch (error) {
      if (
        isError(error, 'CALL_EXCEPTION') &&
        error.revert?.name === 'ResolverNotFound'
      ) {
        return null;
      }
      throw error;
    }
  }

  async getContractMetadata(
    address: string,
  ): Promise<AlchemyContractMetadata | null> {
    const response = await this.alchemyGet<RawV3ContractMetadata | null>(
      `${this.nftV3BaseUrl}/getContractMetadata`,
      { contractAddress: address },
    );
    if (!response) {
      return null;
    }
    return {
      address: response.address,
      name: response.name,
      tokenType: this.normalizeTokenType(response.tokenType),
      openSea: this.normalizeOpenSeaMetadata(response.openseaMetadata),
    };
  }

  async searchContractMetadata(
    query: string,
  ): Promise<AlchemyContractMetadata[]> {
    const response = await this.alchemyGet<RawV2ContractMetadata[]>(
      `${this.nftV2BaseUrl}/searchContractMetadata`,
      { query },
    );
    if (!Array.isArray(response)) {
      throw new Error('Invalid Alchemy contract search response');
    }
    return response.flatMap((contract) => {
      const metadata = contract?.contractMetadata;
      if (!metadata || typeof contract.address !== 'string') {
        return [];
      }
      return [
        {
          address: contract.address,
          name: metadata.name,
          tokenType: this.normalizeTokenType(metadata.tokenType),
          openSea: this.normalizeOpenSeaMetadata(
            metadata.openSea ?? metadata.opensea,
          ),
        },
      ];
    });
  }

  async getContractTokenIds({
    address,
    continuation,
  }: {
    address: string;
    continuation: string | null;
  }): Promise<{ tokens: string[]; continuation: string | null }> {
    const response = await this.alchemyGet<RawContractTokensResponse>(
      `${this.nftV3BaseUrl}/getNFTsForContract`,
      {
        withMetadata: false,
        contractAddress: address,
        startToken: continuation ?? undefined,
        limit: 100,
      },
    );
    if (
      !Array.isArray(response?.nfts) ||
      response.nfts.some((nft) => !this.isTokenId(nft?.tokenId)) ||
      (response.pageKey != null && !this.isTokenId(response.pageKey))
    ) {
      throw new UpstreamProviderError(
        'Alchemy',
        'invalid-response',
        200,
        undefined,
        'Invalid contract tokens response',
        'Invalid Alchemy contract tokens response',
      );
    }
    return {
      tokens: response.nfts.map((nft) => nft.tokenId),
      continuation: response.pageKey ?? null,
    };
  }

  private async getOwnersForContract(
    contractAddress: string,
    options: AlchemyOwnersOptions,
  ): Promise<AlchemyOwnersResponse> {
    const response = await this.alchemyGet<RawOwnersResponse>(
      `${this.nftV2BaseUrl}/getOwnersForCollection`,
      {
        ...options,
        contractAddress,
      },
    );
    if (!Array.isArray(response?.ownerAddresses)) {
      throw new Error('Invalid Alchemy owners response');
    }
    return {
      owners: response.ownerAddresses,
      ...(response.pageKey !== undefined && { pageKey: response.pageKey }),
    };
  }

  private normalizeTokenType(tokenType?: string): string {
    switch (tokenType) {
      case 'erc721':
      case 'ERC721':
        return 'ERC721';
      case 'erc1155':
      case 'ERC1155':
        return 'ERC1155';
      case 'no_supported_nft_standard':
      case 'NO_SUPPORTED_NFT_STANDARD':
        return 'NO_SUPPORTED_NFT_STANDARD';
      case 'not_a_contract':
      case 'NOT_A_CONTRACT':
        return 'NOT_A_CONTRACT';
      default:
        return 'UNKNOWN';
    }
  }

  private isTokenId(value: unknown): value is string {
    return typeof value === 'string' && /^(?:\d+|0x[0-9a-fA-F]+)$/.test(value);
  }

  private normalizeOpenSeaMetadata(
    openSea?: RawOpenSeaMetadata,
  ): AlchemyOpenSeaMetadata | undefined {
    if (!openSea) {
      return undefined;
    }
    return {
      collectionName: openSea.collectionName,
      safelistRequestStatus: OPENSEA_SAFELIST_STATUSES.has(
        openSea.safelistRequestStatus,
      )
        ? openSea.safelistRequestStatus
        : undefined,
      imageUrl: openSea.imageUrl,
      description: openSea.description,
    };
  }

  private async alchemyGet<T>(
    url: string,
    queryParams: Record<string, unknown>,
  ): Promise<T> {
    let lastError: UpstreamProviderError | undefined;
    for (let attempt = 0; attempt < MAX_HTTP_ATTEMPTS; attempt++) {
      await this.waitBeforeAttempt(attempt);
      try {
        const { data } = await this.httpService.axiosRef.get<T>(url, {
          params: queryParams,
          headers: { accept: '*/*' },
        });
        return data;
      } catch (error) {
        lastError = this.toProviderError(error);
        if (!lastError.isTemporary) {
          throw lastError;
        }
      }
    }
    throw lastError ?? new UpstreamProviderError('Alchemy', 'unavailable');
  }

  private toProviderError(error: unknown): UpstreamProviderError {
    if (!axios.isAxiosError(error)) {
      throw error;
    }
    if (!error.response) {
      const message = error.message || 'Alchemy network request failed';
      return new UpstreamProviderError(
        'Alchemy',
        'unavailable',
        undefined,
        undefined,
        sanitizeProviderMessage(message),
        message,
      );
    }

    const status = error.response.status;
    const providerMessage = sanitizeProviderMessage(error.response.data);
    return new UpstreamProviderError(
      'Alchemy',
      this.getFailureKind(status),
      status,
      getProviderRequestId(error.response.headers),
      providerMessage,
      `${status}: ${providerMessage}`,
    );
  }

  private getFailureKind(status: number): UpstreamProviderFailureKind {
    if (status === 429) {
      return 'rate-limited';
    }
    if (status >= 500) {
      return 'unavailable';
    }
    return 'rejected';
  }

  private async waitBeforeAttempt(attempt: number): Promise<void> {
    if (attempt === 0) {
      return;
    }
    await this.sleep(
      INITIAL_RETRY_DELAY_MS * RETRY_MULTIPLIER ** (attempt - 1),
    );
  }

  private async sleep(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
