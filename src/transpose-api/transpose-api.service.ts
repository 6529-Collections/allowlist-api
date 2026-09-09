import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { getAddress, isAddress } from 'ethers';
import {
  getProviderRequestId,
  sanitizeProviderMessage,
  UpstreamProviderError,
  UpstreamProviderFailureKind,
} from '../common/upstream-provider.error';
import { TransposeConfig } from './transpose.config';

const TRANSPOSE_PAGE_SIZE = 1_000;

interface TransposeTokenIdsResponse {
  readonly status?: string;
  readonly message?: string;
  readonly stats?: {
    readonly truncated?: boolean;
  };
  readonly results?: { readonly token_id?: unknown }[];
}

@Injectable()
export class TransposeApiService {
  private readonly logger = new Logger(TransposeApiService.name);
  private readonly BASE_URI = 'https://api.transpose.io/sql';

  constructor(
    private readonly transposeConfig: TransposeConfig,
    private readonly httpService: HttpService,
  ) {}

  public async getContractTokenIds({
    address,
    continuation,
  }: {
    address: string;
    continuation: string | null;
  }): Promise<{ tokens: string[]; continuation: string | null }> {
    const addressVariants = this.getAddressVariants(address);
    // DISTINCT makes the last token ID a unique page boundary. Strict `>`
    // intentionally excludes that already-returned boundary on the next page.
    const continuationClause = continuation
      ? `AND token_id > CAST('{{continuation}}' AS NUMERIC)`
      : '';
    const sql = `
    SELECT distinct token_id
    FROM ethereum.nfts
    WHERE contract_address IN ('{{address_lower}}', '{{address_checksum}}')
    ${continuationClause}
    ORDER BY token_id ASC
    LIMIT ${TRANSPOSE_PAGE_SIZE}
  `;

    const headers = {
      'x-api-key': `${this.transposeConfig.key}`,
      'Content-Type': 'application/json',
    };

    let data: TransposeTokenIdsResponse;
    try {
      const response =
        await this.httpService.axiosRef.post<TransposeTokenIdsResponse>(
          this.BASE_URI,
          {
            sql,
            parameters: {
              address_lower: addressVariants.lower,
              address_checksum: addressVariants.checksum,
              ...(continuation ? { continuation } : {}),
            },
            options: { stringify_numbers: true },
          },
          { headers },
        );
      data = response.data;
      if (data?.status !== 'success') {
        throw new UpstreamProviderError(
          'Transpose',
          this.isRateLimitMessage(data?.message) ? 'rate-limited' : 'rejected',
          response.status,
          getProviderRequestId(response.headers),
          sanitizeProviderMessage(data?.message),
        );
      }
    } catch (error) {
      const providerError = this.toProviderError(error);
      this.logFailure('get-contract-token-ids', providerError);
      throw providerError;
    }

    if (
      !data.stats ||
      typeof data.stats.truncated !== 'boolean' ||
      data.stats?.truncated === true ||
      !Array.isArray(data.results) ||
      data.results.some(
        (result) =>
          typeof result?.token_id !== 'string' ||
          !/^\d+$/.test(result.token_id),
      )
    ) {
      const error = new UpstreamProviderError(
        'Transpose',
        'invalid-response',
        200,
        undefined,
        data.stats?.truncated
          ? 'Query result was truncated'
          : 'Invalid token ID response',
      );
      this.logFailure('get-contract-token-ids', error);
      throw error;
    }

    const items = data.results.map((result) => result.token_id as string);

    return {
      tokens: items,
      continuation:
        items.length === TRANSPOSE_PAGE_SIZE ? (items.at(-1) ?? null) : null,
    };
  }

  private getAddressVariants(address: string): {
    lower: string;
    checksum: string;
  } {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address) || !isAddress(address)) {
      throw new BadRequestException('Invalid contract address');
    }
    return {
      lower: address.toLowerCase(),
      checksum: getAddress(address),
    };
  }

  private toProviderError(error: unknown): UpstreamProviderError {
    if (error instanceof UpstreamProviderError) {
      return error;
    }
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const providerMessage = sanitizeProviderMessage(
        (error.response?.data as { message?: unknown })?.message ??
          error.response?.data ??
          error.message ??
          'Network request failed',
      );
      return new UpstreamProviderError(
        'Transpose',
        this.getFailureKind(status, providerMessage),
        status,
        getProviderRequestId(error.response?.headers),
        providerMessage,
      );
    }
    throw error;
  }

  private getFailureKind(
    status: number | undefined,
    message?: string,
  ): UpstreamProviderFailureKind {
    if (status === 429 || this.isRateLimitMessage(message)) {
      return 'rate-limited';
    }
    if (status === undefined || status >= 500) {
      return 'unavailable';
    }
    return 'rejected';
  }

  private isRateLimitMessage(message?: string): boolean {
    return /rate\s*limit|too many requests/i.test(message ?? '');
  }

  private logFailure(operation: string, error: UpstreamProviderError): void {
    this.logger.error(
      `[UPSTREAM_PROVIDER_FAILURE] provider=${
        error.provider
      } operation=${operation} kind=${error.kind} status=${
        error.upstreamStatus ?? 'none'
      } requestId=${error.requestId ?? 'none'} message=${
        error.providerMessage ?? 'none'
      }`,
    );
  }
}
