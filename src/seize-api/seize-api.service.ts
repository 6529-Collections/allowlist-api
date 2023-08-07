import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { SeizeApiSeizeSeasonResponse } from './seize-api.types';

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

  async getMemesSeasons(): Promise<SeizeApiSeizeSeasonResponse[]> {
    const url = `${this.BASE_URL}/memes_seasons`;
    return await this.seizeGet<SeizeApiSeizeSeasonResponse[]>(url, {});
  }
}
