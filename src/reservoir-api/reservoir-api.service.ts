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

  async getContractMetadataById(
    id: string,
  ): Promise<ReservoirCollectionsResponse> {
    const url = `${this.BASE_URI}collections/v6?id=${id}`;
    return await this.reservoirGet<ReservoirCollectionsResponse>(url, {});
  }

  async getContractsMetadataByAddresses(
    addresses: string[],
  ): Promise<ReservoirCollectionsResponse> {
    const url = `${this.BASE_URI}collections/v6?${addresses
      .map((address, i) => {
        if (i === 0) {
          return `contract=${address}`;
        }
        return `&contract=${address}`;
      })
      .join('')}`;
    return await this.reservoirGet<ReservoirCollectionsResponse>(url, {});
  }

  async getContractsMetadataByAddress(address: string): Promise<any> {
    const url = `${this.BASE_URI}collections/v6?contract=${address}`;
    return await this.reservoirGet<ReservoirCollectionsResponse>(url, {});
  }

  async getContractTokenIds({
    address,
    continuation,
  }: {
    address: string;
    continuation: string | null;
  }): Promise<{ tokens: string[]; continuation: string | null }> {
    const url = `${this.BASE_URI}tokens/ids/v1?collection=${address}${
      continuation ? `&continuation=${continuation}` : ''
    }&limit=10000`;
    return await this.reservoirGet<{
      tokens: string[];
      continuation: string | null;
    }>(url, {});
  }
}
