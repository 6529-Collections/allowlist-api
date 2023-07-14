import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ReservoirCollectionsResponse } from './reservoir-api.types';

@Injectable()
export class ReservoirApiService {
  private readonly BASE_URI = 'https://api.reservoir.tools/';
  private readonly HEADERS = {
    accept: '*/*',
    'x-api-key': process.env.RESERVOIR_APY_KEY,
  };
  constructor(private readonly httpService: HttpService) {}

  private async reservoirGet<T>(url: string, queryParams: any): Promise<T> {
    const [{ data }] = await Promise.all([
      this.httpService.axiosRef.get<T>(url, {
        params: queryParams,
        headers: this.HEADERS,
      }),
    ]);
    return data;
  }

  async searchContractMetadata(
    kw: string,
  ): Promise<ReservoirCollectionsResponse> {
    const url = `${this.BASE_URI}collections/v6?name=${kw}`;
    return await this.reservoirGet<ReservoirCollectionsResponse>(url, {});
  }
}
