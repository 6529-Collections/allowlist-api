import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  getProviderRequestId,
  sanitizeProviderMessage,
  UpstreamProviderError,
} from '../common/upstream-provider.error';
import { EtherscanGetBlockCountdownResponse } from './etherscan-api.types';

const ETHERSCAN_API_URI = 'https://api.etherscan.io/v2/api';
const BLOCK_TIME_CACHE_TTL_MS = 30_000;
const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 500;
const MAX_RETRY_JITTER_MS = 250;

@Injectable()
export class EtherscanApiService {
  private readonly logger = new Logger(EtherscanApiService.name);
  private cachedBlockTime:
    | { readonly milliseconds: number; readonly expiresAt: number }
    | undefined;
  private blockTimeRequest: Promise<number> | undefined;

  constructor(private readonly httpService: HttpService) {}

  async getBlockTimeMillis(param: { blockNumber: number }): Promise<number> {
    const now = Date.now();
    if (this.cachedBlockTime && this.cachedBlockTime.expiresAt > now) {
      return this.cachedBlockTime.milliseconds;
    }

    if (!this.blockTimeRequest) {
      this.blockTimeRequest = this.fetchBlockTimeMillis(param).finally(() => {
        this.blockTimeRequest = undefined;
      });
    }
    return await this.blockTimeRequest;
  }

  private async fetchBlockTimeMillis(param: {
    blockNumber: number;
  }): Promise<number> {
    const response = await this.getBlockCountdown(param);
    const result = response.result;
    const remainingBlocks = Number(
      typeof result === 'object' ? result?.RemainingBlock : undefined,
    );
    const estimateTimeInSeconds = Number(
      typeof result === 'object' ? result?.EstimateTimeInSec : undefined,
    );
    if (
      !Number.isFinite(remainingBlocks) ||
      remainingBlocks <= 0 ||
      !Number.isFinite(estimateTimeInSeconds) ||
      estimateTimeInSeconds <= 0
    ) {
      const error = new UpstreamProviderError(
        'Etherscan',
        'invalid-response',
        200,
        undefined,
        'Invalid countdown values',
      );
      this.logFailure('getblockcountdown', error);
      throw error;
    }

    const milliseconds = (estimateTimeInSeconds * 1000) / remainingBlocks;
    this.cachedBlockTime = {
      milliseconds,
      expiresAt: Date.now() + BLOCK_TIME_CACHE_TTL_MS,
    };
    return milliseconds;
  }

  private async getBlockCountdown(param: {
    blockNumber: number;
  }): Promise<EtherscanGetBlockCountdownResponse> {
    let lastError: UpstreamProviderError | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await this.sleep(
          INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1) +
            Math.floor(Math.random() * MAX_RETRY_JITTER_MS),
        );
      }

      try {
        const response =
          await this.httpService.axiosRef.get<EtherscanGetBlockCountdownResponse>(
            ETHERSCAN_API_URI,
            {
              params: {
                chainid: '1',
                module: 'block',
                action: 'getblockcountdown',
                blockno: param.blockNumber,
                apikey: process.env.ALLOWLIST_ETHERSCAN_API_KEY,
              },
            },
          );
        const providerMessage = sanitizeProviderMessage(
          response.data?.result ?? response.data?.message,
        );
        if (response.data?.message === 'OK' && response.data?.status === '1') {
          return response.data;
        }

        lastError = new UpstreamProviderError(
          'Etherscan',
          this.isRateLimitMessage(providerMessage)
            ? 'rate-limited'
            : 'rejected',
          200,
          getProviderRequestId(response.headers),
          providerMessage,
        );
      } catch (error) {
        if (error instanceof UpstreamProviderError) {
          lastError = error;
        } else if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          lastError = new UpstreamProviderError(
            'Etherscan',
            status === 429
              ? 'rate-limited'
              : status === undefined || status >= 500
              ? 'unavailable'
              : 'rejected',
            status,
            getProviderRequestId(error.response?.headers),
            sanitizeProviderMessage(
              error.response?.data ?? error.message ?? 'Network request failed',
            ),
          );
        } else {
          throw error;
        }
      }

      if (!lastError.isTemporary || attempt === MAX_ATTEMPTS - 1) {
        this.logFailure('getblockcountdown', lastError);
        throw lastError;
      }
    }

    throw lastError ?? new UpstreamProviderError('Etherscan', 'unavailable');
  }

  private isRateLimitMessage(message?: string): boolean {
    return /rate\s*limit|too many requests/i.test(message ?? '');
  }

  private async sleep(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
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
