import { Injectable } from '@nestjs/common';
import { TokenPoolDownloadEntity } from '../../repository/token-pool-download/token-pool-download.entity';
import { TokenPoolDownloadResponseApiModel } from './model/token-pool-download-response-api.model';
import { TokenPoolDownloadRepository } from '../../repository/token-pool-download/token-pool-download.repository';
import { PhaseComponentWinnerRepository } from '../../repository/phase-component-winner/phase-component-winner.repository';
import { TokenPoolTokenRepository } from '../../repository/token-pool-token/token-pool-token.repository';

@Injectable()
export class TokenPoolDownloadService {
  constructor(
    private readonly tokenPoolDownloadRepository: TokenPoolDownloadRepository,
    private readonly componentWinners: PhaseComponentWinnerRepository,
    private readonly tokenPoolTokenRepository: TokenPoolTokenRepository,
  ) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<TokenPoolDownloadResponseApiModel[]> {
    const entity = await this.tokenPoolDownloadRepository.getByAllowlistId(
      allowlistId,
    );
    return entity.map(this.entityToApiModel);
  }

  async getUniqueWalletsCount({
    allowlistId,
    tokenPoolId,
    excludeComponentIds,
  }: {
    allowlistId: string;
    tokenPoolId: string;
    excludeComponentIds: string[];
  }): Promise<number> {
    const [componentWinners, tokenPoolWallets] = await Promise.all([
      new Set(
        excludeComponentIds.length
          ? await this.componentWinners.getUniqueWalletsByComponentIds({
              componentIds: excludeComponentIds,
            })
          : [],
      ),
      new Set(
        await this.tokenPoolTokenRepository.getUniqueWalletsByTokenPoolId(
          tokenPoolId,
        ),
      ),
    ]);

    for (const value of componentWinners) {
      tokenPoolWallets.delete(value);
    }
    return tokenPoolWallets.size;
  }

  private entityToApiModel(
    entity: TokenPoolDownloadEntity,
  ): TokenPoolDownloadResponseApiModel {
    return {
      contract: entity.contract,
      tokenIds: entity.token_ids,
      tokenPoolId: entity.token_pool_id,
      allowlistId: entity.allowlist_id,
      blockNo: entity.block_no,
      status: entity.status,
    };
  }
}
