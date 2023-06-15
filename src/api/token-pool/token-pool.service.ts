import { BadRequestException, Injectable } from '@nestjs/common';
import { TokenPoolRepository } from '../../repository/token-pool/token-pool.repository';
import { TokenPoolResponseApiModel } from './model/token-pool-response-api.model';
import { TokenPoolEntity } from '../../repository/token-pool/token-pool.entity';

@Injectable()
export class TokenPoolService {
  constructor(private readonly tokenPoolRepository: TokenPoolRepository) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<TokenPoolResponseApiModel[]> {
    const entity = await this.tokenPoolRepository.getByAllowlistId(allowlistId);
    return entity.map(this.entityToApiModel);
  }

  async getTokenPool(param: {
    allowlistId: string;
    tokenPoolId: string;
  }): Promise<TokenPoolResponseApiModel> {
    const { allowlistId, tokenPoolId } = param;
    const tokenPool = await this.tokenPoolRepository.getAllowlistTokenPool({
      allowlistId,
      tokenPoolId,
    });
    if (!tokenPool) {
      throw new BadRequestException('Token pool not found');
    }
    return this.entityToApiModel(tokenPool);
  }

  private entityToApiModel(entity: TokenPoolEntity): TokenPoolResponseApiModel {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      allowlistId: entity.allowlist_id,
      transferPoolId: entity.transfer_pool_id,
      tokenIds: entity.token_ids,
      walletsCount: entity.wallets_count,
      tokensCount: entity.tokens_count,
    };
  }
}
