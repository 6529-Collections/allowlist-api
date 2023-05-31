import { Injectable } from '@nestjs/common';
import { AllowlistOperationsRepository } from '../repositories/allowlist-operations/allowlist-operations.repository';
import { AllowlistRunsRepository } from '../repositories/allowlist-runs/allowlist-runs.repository';
import { AllowlistsRepository } from '../repositories/allowlist/allowlists.repository';
import { CustomTokenPoolTokensRepository } from '../repositories/custom-token-pool-tokens/custom-token-pool-tokens.repository';
import { CustomTokenPoolsRepository } from '../repositories/custom-token-pools/custom-token-pools.repository';
import { PhaseComponentItemTokensRepository } from '../repositories/phase-component-item-tokens/phase-component-item-tokens.repository';
import { PhaseComponentItemsRepository } from '../repositories/phase-component-items/phase-component-items.repository';
import { PhaseComponentWinnersRepository } from '../repositories/phase-component-winners/phase-component-winners.repository';
import { PhaseComponentsRepository } from '../repositories/phase-components/phase-components.repository';
import { PhasesRepository } from '../repositories/phases/phases.repository';
import { TokenPoolTokensRepository } from '../repositories/token-pool-tokens/token-pool-tokens.repository';
import { TokenPoolsRepository } from '../repositories/token-pools/token-pools.repository';
import { TransferPoolTransfersRepository } from '../repositories/transfer-pool-transfers/transfer-pool-transfers.repository';
import { TransferPoolsRepository } from '../repositories/transfer-pools/transfer-pools.repository';
import { WalletPoolWalletsRepository } from '../repositories/wallet-pool-wallets/wallet-pool-wallets.repository';
import { WalletPoolsRepository } from '../repositories/wallet-pools/wallet-pools.repository';

@Injectable()
export class CommonService {
  constructor(
    private readonly allowlistRunsRepository: AllowlistRunsRepository,
    private readonly allowlistsRepository: AllowlistsRepository,
    private readonly allowlistOperationsRepository: AllowlistOperationsRepository,
    private readonly transferPoolsRepository: TransferPoolsRepository,
    private readonly transferPoolTransfersRepository: TransferPoolTransfersRepository,
    private readonly tokenPoolsRepository: TokenPoolsRepository,
    private readonly tokenPoolTokensRepository: TokenPoolTokensRepository,
    private readonly customTokenPoolsRepository: CustomTokenPoolsRepository,
    private readonly customTokenPoolTokensRepository: CustomTokenPoolTokensRepository,
    private readonly walletPoolsRepository: WalletPoolsRepository,
    private readonly walletPoolWalletsRepository: WalletPoolWalletsRepository,
    private readonly phasesRepository: PhasesRepository,
    private readonly phaseComponentsRepository: PhaseComponentsRepository,
    private readonly phaseComponentWinnersRepository: PhaseComponentWinnersRepository,
    private readonly phaseComponentItemsRepository: PhaseComponentItemsRepository,
    private readonly phaseComponentItemTokensRepository: PhaseComponentItemTokensRepository,
  ) {}

  async deleteAllowlist(allowlistId: string): Promise<void> {
    await Promise.all([
      this.allowlistsRepository.delete(allowlistId),
      this.allowlistRunsRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.allowlistOperationsRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.transferPoolTransfersRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.transferPoolsRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.tokenPoolsRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.tokenPoolTokensRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.customTokenPoolsRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.customTokenPoolTokensRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.walletPoolsRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.walletPoolWalletsRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.phasesRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.phaseComponentsRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.phaseComponentWinnersRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.phaseComponentItemsRepository.deleteByAllowlistId({
        allowlistId,
      }),
      this.phaseComponentItemTokensRepository.deleteByAllowlistId({
        allowlistId,
      }),
    ]);
  }
}
