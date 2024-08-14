import { Injectable } from '@nestjs/common';
import { TokenPoolDownloadEntity } from '../../repository/token-pool-download/token-pool-download.entity';
import { TokenPoolDownloadResponseApiModel } from './model/token-pool-download-response-api.model';
import { TokenPoolDownloadRepository } from '../../repository/token-pool-download/token-pool-download.repository';
import { PhaseComponentWinnerRepository } from '../../repository/phase-component-winner/phase-component-winner.repository';
import { TokenPoolTokenRepository } from '../../repository/token-pool-token/token-pool-token.repository';
import { TokenPoolDownloadTokenPoolUniqueWalletsCountRequestApiModel } from './model/token-pool-download-token-pool-unique-wallets-count-request-api.model';
import { Pool } from '@6529-collections/allowlist-lib/app-types';
import { TokenPoolDownloadTokenResponseApiModel } from './model/token-pool-download-token-response-api.model';

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

  async getTokenPoolUniqueWalletsCount({
    tokenPoolId,
    params: { excludeComponentWinners, excludeSnapshots, extraWallets },
  }: {
    tokenPoolId: string;
    params: TokenPoolDownloadTokenPoolUniqueWalletsCountRequestApiModel;
  }): Promise<number> {
    const [componentWinners, tokenPoolsWallets, tokenPoolWallets] =
      await Promise.all([
        new Set(
          excludeComponentWinners.length
            ? await this.componentWinners.getUniqueWalletsByComponentIds({
                componentIds: excludeComponentWinners,
              })
            : [],
        ),
        new Set(
          await this.tokenPoolTokenRepository.getUniqueWalletsByTokenPoolIds(
            excludeSnapshots
              .filter((s) => s.snapshotType === Pool.TOKEN_POOL)
              .map((s) => s.snapshotId),
          ),
        ),
        new Set([
          ...(await this.tokenPoolTokenRepository.getUniqueWalletsByTokenPoolId(
            tokenPoolId,
          )),
          ...extraWallets.map((wallet) => wallet.toLowerCase()),
        ]),
      ]);

    const customTokenPoolWallets = new Set<string>(
      excludeSnapshots
        .filter((s) => s.snapshotType === Pool.CUSTOM_TOKEN_POOL)
        .flatMap((s) => s.extraWallets),
    );

    const walletPoolWallets = new Set<string>(
      excludeSnapshots
        .filter((s) => s.snapshotType === Pool.WALLET_POOL)
        .flatMap((s) => s.extraWallets),
    );

    for (const value of componentWinners) {
      tokenPoolWallets.delete(value);
    }

    for (const value of tokenPoolsWallets) {
      tokenPoolWallets.delete(value);
    }

    for (const value of customTokenPoolWallets) {
      tokenPoolWallets.delete(value);
    }

    for (const value of walletPoolWallets) {
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
      consolidateBlockNo: entity.consolidate_block_no,
    };
  }

  async getTokenPoolTokens({
    tokenPoolId,
  }: {
    tokenPoolId: string;
  }): Promise<TokenPoolDownloadTokenResponseApiModel[]> {
    const tokens = await this.tokenPoolTokenRepository.getTokenPoolsTokens([
      tokenPoolId,
    ]);
    return tokens.map((token) => ({
      address: token.wallet,
      token_id: token.token_id,
      balance: token.amount,
      contract: token.contract,
    }));
  }
}
