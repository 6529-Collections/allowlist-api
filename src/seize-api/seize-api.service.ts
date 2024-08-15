import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  SeizeAPIWalletConsolidatedMetricsResponse,
  SeizeApiSeizeSeasonResponse,
} from './seize-api.types';

@Injectable()
export class SeizeApiService {
  private readonly BASE_URL = process.env.ALLOWLIST_SEIZE_API_PATH;
  private readonly HEADERS = {
    accept: '*/*',
    'x-6529-auth': process.env.ALLOWLIST_SEIZE_API_KEY,
  };
  constructor(private readonly httpService: HttpService) {}

  private async seizeGet<T>(url: string, queryParams: any): Promise<T> {
    const [{ data }] = await Promise.all([
      this.httpService.axiosRef.get<T>(url, {
        params: queryParams,
        headers: this.HEADERS,
      }),
    ]);
    return data;
  }

  async getWalletConsolidations(wallet: string): Promise<string[]> {
    const url = `${this.BASE_URL}/consolidations/${wallet}`;
    const response: { data: string[] } | undefined = await this.seizeGet(
      url,
      {},
    );
    return response?.data?.map((wallet) => wallet.toLowerCase()) ?? [wallet];
  }

  async getMemesSeasons(): Promise<SeizeApiSeizeSeasonResponse[]> {
    const url = `${this.BASE_URL}/memes_seasons`;
    return await this.seizeGet<SeizeApiSeizeSeasonResponse[]>(url, {});
  }

  async getWalletConsolidatedMetrics(
    wallet: string,
  ): Promise<SeizeAPIWalletConsolidatedMetricsResponse> {
    const url = `${this.BASE_URL}/tdh/consolidated_metrics?search=${wallet}`;
    return await this.seizeGet<SeizeAPIWalletConsolidatedMetricsResponse>(
      url,
      {},
    );
  }
}
