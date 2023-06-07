import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomTokenPoolRepository } from '../../repository/custom-token-pool/custom-token-pool.repository';
import { CustomTokenPoolResponseApiModel } from './model/custom-token-pool-response-api.model';

@Injectable()
export class CustomTokenPoolService {
  constructor(
    private readonly customTokenPoolRepository: CustomTokenPoolRepository,
  ) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<CustomTokenPoolResponseApiModel[]> {
    const entities = await this.customTokenPoolRepository.getByAllowlistId(
      allowlistId,
    );
    return entities.map(this.customTokenPoolEntityToApiModel);
  }

  async getCustomTokenPool(param: {
    allowlistId: string;
    customTokenPoolId: string;
  }): Promise<CustomTokenPoolResponseApiModel> {
    const { allowlistId, customTokenPoolId } = param;
    const customTokenPool =
      this.customTokenPoolRepository.getByExternalIdAndAllowlistId({
        allowlistId,
        customTokenPoolId,
      });
    if (!customTokenPool) {
      throw new BadRequestException('Custom token pool not found');
    }
    return this.customTokenPoolEntityToApiModel(customTokenPool);
  }

  private customTokenPoolEntityToApiModel(
    model: any,
  ): CustomTokenPoolResponseApiModel {
    return {
      id: model.id,
      name: model.name,
      description: model.description,
      allowlistId: model.allowlist_id,
    };
  }
}
