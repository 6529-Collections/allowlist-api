import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EtherscanGetBlockCountdownResponse } from './etherscan-api.types';

@Injectable()
export class EtherscanApiService {
  constructor(private readonly httpService: HttpService) {}

  async currentBlockNumber(): Promise<number> {
    const blockNumber = await this.httpService.axiosRef
      .get(
        'https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_blockNumber&apikey=' +
          process.env.ALLOWLIST_ETHERSCAN_API_KEY,
      )
      .then((res) => res.data.result);
    const result = parseInt(blockNumber, 16);
    if (isNaN(result)) {
      throw new BadRequestException(
        `Invalid response from Etherscan->currentBlockNumber: ${blockNumber}`,
      );
    }
    return result;
  }

  async getBlockCountdown(param: {
    blockNumber: number;
  }): Promise<EtherscanGetBlockCountdownResponse> {
    const response = await this.httpService.axiosRef.get(
      `https://api.etherscan.io/v2/api?chainid=1&module=block&action=getblockcountdown&blockno=${param.blockNumber}&apikey=${process.env.ALLOWLIST_ETHERSCAN_API_KEY}}`,
    );
    if (response.data?.message !== 'OK' || response.data?.status !== '1') {
      throw new BadRequestException(
        response.data.result ??
          'Something went wrong with Etherscan->getBlockCountdown',
      );
    }
    return response.data;
  }
}
