import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { randomInt } from 'node:crypto';
import {
  getProviderRequestId,
  sanitizeProviderMessage,
  UpstreamProviderError,
  UpstreamProviderFailureKind,
} from '../common/upstream-provider.error';
import { EtherscanGetBlockCountdownResponse } from './etherscan-api.types';

const ETHERSCAN_API_URI = 'https://api.etherscan.io/v2/api';
const BLOCK_TIME_CACHE_TTL_MS = 30_000;
const BLOCK_ESTIMATE_BUCKET_SIZE = 1_000;
const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 500;
const MAX_RETRY_JITTER_MS = 250;

@Injectable()
export class EtherscanApiService {
  private readonly logger = new Logger(EtherscanApiService.name);
  private readonly cachedBlockTimes = new Map<
    number,
    { readonly milliseconds: number; readonly expiresAt: number }
  >();
  private readonly blockTimeRequests = new Map<number, Promise<number>>();

  constructor(private readonly httpService: HttpService) {}

  /**
   * Samples a network-wide block-time estimate over a stable future window.
   * Current blocks in the same bucket deliberately share a countdown target,
   * allowing safe short-lived caching without mixing target-specific estimates.
   */
  async getBlockTimeMillis(param: { currentBlock: number }): Promise<number> {
    const estimateTargetBlock = this.getEstimateTargetBlock(param.currentBlock);
    const cached = this.cachedBlockTimes.get(estimateTargetBlock);
    if (cached?.expiresAt && cached.expiresAt > Date.now()) {
      return cached.milliseconds;
    }
    this.cachedBlockTimes.delete(estimateTargetBlock);

    const pending = this.blockTimeRequests.get(estimateTargetBlock);
    if (pending) {
      return await pending;
    }

    const request = this.fetchBlockTimeMillis(estimateTargetBlock).finally(() =>
      this.blockTimeRequests.delete(estimateTargetBlock),
    );
    this.blockTimeRequests.set(estimateTargetBlock, request);
    return await request;
  }

  private getEstimateTargetBlock(currentBlock: number): number {
    return (
      (Math.floor(currentBlock / BLOCK_ESTIMATE_BUCKET_SIZE) + 2) *
      BLOCK_ESTIMATE_BUCKET_SIZE
    );
  }

  private async fetchBlockTimeMillis(blockNumber: number): Promise<number> {
    const response = await this.getBlockCountdown(blockNumber);
    const milliseconds = this.parseBlockTimeMillis(response);
    this.cachedBlockTimes.set(blockNumber, {
      milliseconds,
      expiresAt: Date.now() + BLOCK_TIME_CACHE_TTL_MS,
    });
    return milliseconds;
  }

  private parseBlockTimeMillis(
    response: EtherscanGetBlockCountdownResponse,
  ): number {
    const result = response.result;
    const remainingBlocks = Number(
      typeof result === 'object' ? result?.RemainingBlock : undefined,
    );
    const estimateTimeInSeconds = Number(
      typeof result === 'object' ? result?.EstimateTimeInSec : undefined,
    );
    if (
      Number.isFinite(remainingBlocks) &&
      remainingBlocks > 0 &&
      Number.isFinite(estimateTimeInSeconds) &&
      estimateTimeInSeconds > 0
    ) {
      return (estimateTimeInSeconds * 1000) / remainingBlocks;
    }

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

  private async getBlockCountdown(
    blockNumber: number,
  ): Promise<EtherscanGetBlockCountdownResponse> {
    let lastError: UpstreamProviderError | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await this.waitBeforeAttempt(attempt);
      try {
        return await this.requestBlockCountdown(blockNumber);
      } catch (error) {
        lastError = this.toProviderError(error);
        if (!lastError.isTemporary || attempt === MAX_ATTEMPTS - 1) {
          this.logFailure('getblockcountdown', lastError);
          throw lastError;
        }
      }
    }

    throw lastError ?? new UpstreamProviderError('Etherscan', 'unavailable');
  }

  private async requestBlockCountdown(
    blockNumber: number,
  ): Promise<EtherscanGetBlockCountdownResponse> {
    const response =
      await this.httpService.axiosRef.get<EtherscanGetBlockCountdownResponse>(
        ETHERSCAN_API_URI,
        {
          params: {
            chainid: '1',
            module: 'block',
            action: 'getblockcountdown',
            blockno: blockNumber,
            apikey: process.env.ALLOWLIST_ETHERSCAN_API_KEY,
          },
        },
      );
    if (response.data?.message === 'OK' && response.data?.status === '1') {
      return response.data;
    }

    const providerMessage = sanitizeProviderMessage(
      response.data?.result ?? response.data?.message,
    );
    throw new UpstreamProviderError(
      'Etherscan',
      this.isRateLimitMessage(providerMessage) ? 'rate-limited' : 'rejected',
      200,
      getProviderRequestId(response.headers),
      providerMessage,
    );
  }

  private toProviderError(error: unknown): UpstreamProviderError {
    if (error instanceof UpstreamProviderError) {
      return error;
    }
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const status = error.response?.status;
    const providerMessage = sanitizeProviderMessage(
      error.response?.data ?? error.message ?? 'Network request failed',
    );
    return new UpstreamProviderError(
      'Etherscan',
      this.getFailureKind(status, providerMessage),
      status,
      getProviderRequestId(error.response?.headers),
      providerMessage,
    );
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

  private async waitBeforeAttempt(attempt: number): Promise<void> {
    if (attempt === 0) {
      return;
    }
    await this.sleep(
      INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1) + this.retryJitterMs(),
    );
  }

  private retryJitterMs(): number {
    return randomInt(0, MAX_RETRY_JITTER_MS + 1);
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
