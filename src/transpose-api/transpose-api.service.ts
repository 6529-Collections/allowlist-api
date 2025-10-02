import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { getAddress, isAddress } from 'ethers';
import { TransposeConfig } from './transpose.config';

@Injectable()
export class TransposeApiService {
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
    const variants = this.buildAddressVariants(address);

    const addrListSQL = variants.map((v) => `'${v}'`).join(', ');
    const baseSQL = `
    SELECT distinct token_id
    FROM ethereum.nfts
    WHERE contract_address IN (${addrListSQL})
    ORDER BY token_id ASC
  `;

    const headers = {
      'x-api-key': `${this.transposeConfig.key}`,
      'Content-Type': 'application/json',
    };

    const { data } = await this.httpService.axiosRef.post(
      this.BASE_URI,
      { sql: baseSQL, cursor: continuation ?? undefined },
      { headers },
    );
    const items: string[] = data.results.map(
      (r: { token_id: string }) => r.token_id,
    );

    return {
      tokens: items,
      continuation: data.next_page ?? null,
    };
  }

  private toChecksum(addr: string) {
    try {
      return getAddress(addr);
    } catch {
      return null;
    }
  }
  private toLower(addr: string) {
    return addr.toLowerCase();
  }

  private buildAddressVariants(raw: string): string[] {
    if (!/^0x[0-9a-fA-F]{40}$/.test(raw) || !isAddress(raw)) {
      throw new Error(`Invalid address: ${raw}`);
    }
    const orig = raw;
    const lower = this.toLower(raw);
    const checksum = this.toChecksum(raw);
    if (!checksum) {
      throw new Error(`Invalid address: ${raw}`);
    }
    return Array.from(new Set([orig, lower, checksum]));
  }
}
