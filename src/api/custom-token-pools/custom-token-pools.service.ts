import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomTokenPoolsRepository } from '../../repositories/custom-token-pools/custom-token-pools.repository';
import { CustomTokenPoolResponseApiModel } from './models/custom-token-pool-response-api.model';

@Injectable()
export class CustomTokenPoolsService {
  constructor(
    private readonly customTokenPoolsRepository: CustomTokenPoolsRepository,
  ) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<CustomTokenPoolResponseApiModel[]> {
    return this.customTokenPoolsRepository.getByAllowlistId(allowlistId);
  }

  async getCustomTokenPool(param: {
    allowlistId: string;
    customTokenPoolId: string;
  }): Promise<CustomTokenPoolResponseApiModel> {
    const { allowlistId, customTokenPoolId } = param;
    const customTokenPool =
      this.customTokenPoolsRepository.getAllowlistCustomTokenPool({
        allowlistId,
        customTokenPoolId,
      });
    if (!customTokenPool) {
      throw new BadRequestException('Custom token pool not found');
    }
    return customTokenPool;
  }
}
