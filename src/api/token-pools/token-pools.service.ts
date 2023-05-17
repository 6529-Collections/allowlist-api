import { BadRequestException, Injectable } from '@nestjs/common';
import { TokenPoolsRepository } from '../../repositories/token-pools/token-pools.repository';
import { TokenPoolResponseApiModel } from './models/token-pool-response-api.model';

@Injectable()
export class TokenPoolsService {
  constructor(private readonly tokenPoolsRepository: TokenPoolsRepository) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<TokenPoolResponseApiModel[]> {
    return this.tokenPoolsRepository.getByAllowlistId(allowlistId);
  }

  async getTokenPool(param: {
    allowlistId: string;
    tokenPoolId: string;
  }): Promise<TokenPoolResponseApiModel> {
    const { allowlistId, tokenPoolId } = param;
    const tokenPool = this.tokenPoolsRepository.getAllowlistTokenPool({
      allowlistId,
      tokenPoolId,
    });
    if (!tokenPool) {
      throw new BadRequestException('Token pool not found');
    }
    return tokenPool;
  }
}
