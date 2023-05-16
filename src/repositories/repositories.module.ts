import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransferModel, TransferSchema } from './transfer/transfer.model';
import { TransferRepository } from './transfer/transfer.repository';
import {
  AllowlistModel,
  AllowlistRequestSchema,
} from './allowlist/allowlist.model';
import { AllowlistsRepository } from './allowlist/allowlists.repository';
import {
  AllowlistOperationModel,
  AllowlistOperationSchema,
} from './allowlist-operations/allowlist-operation.model';
import { AllowlistOperationsRepository } from './allowlist-operations/allowlist-operations.repository';
import {
  AllowlistRunModel,
  AllowlistRunSchema,
} from './allowlist-runs/allowlist-runs.model';
import { AllowlistRunsRepository } from './allowlist-runs/allowlist-runs.repository';
import {
  TransferPoolModel,
  TransferPoolSchema,
} from './transfer-pools/transfer-pool.model';
import { TransferPoolsRepository } from './transfer-pools/transfer-pools.repository';
import {
  TransferPoolTransferModel,
  TransferPoolTransferSchema,
} from './transfer-pool-transfers/transfer-pool-transfer.model';
import { TransferPoolTransfersRepository } from './transfer-pool-transfers/transfer-pool-transfers.repository';
import {
  TokenPoolModel,
  TokenPoolSchema,
} from './token-pools/token-pool.model';
import { TokenPoolsRepository } from './token-pools/token-pools.repository';
import {
  TokenPoolTokenModel,
  TokenPoolTokenSchema,
} from './token-pool-tokens/token-pool-token.model';
import { TokenPoolTokensRepository } from './token-pool-tokens/token-pool-tokens.repository';
import {
  CustomTokenPoolModel,
  CustomTokenPoolSchema,
} from './custom-token-pools/custom-token-pool.model';
import { CustomTokenPoolsRepository } from './custom-token-pools/custom-token-pools.repository';
import {
  CustomTokenPoolTokenModel,
  CustomTokenPoolTokenSchema,
} from './custom-token-pool-tokens/custom-token-pool-token.model';
import { CustomTokenPoolTokensRepository } from './custom-token-pool-tokens/custom-token-pool-tokens.repository';
import {
  WalletPoolModel,
  WalletPoolSchema,
} from './wallet-pools/wallet-pool.model';
import { WalletPoolsRepository } from './wallet-pools/wallet-pools.repository';
import {
  WalletPoolWalletModel,
  WalletPoolWalletSchema,
} from './wallet-pool-wallets/wallet-pool-wallet.model';
import { WalletPoolWalletsRepository } from './wallet-pool-wallets/wallet-pool-wallets.repository';
import { PhaseModel, PhaseSchema } from './phases/phase.model';
import { PhasesRepository } from './phases/phases.repository';
import {
  PhaseComponentModel,
  PhaseComponentSchema,
} from './phase-components/phase-component.model';
import { PhaseComponentsRepository } from './phase-components/phase-components.repository';
import {
  PhaseComponentWinnerModel,
  PhaseComponentWinnerSchema,
} from './phase-component-winners/phase-component-winner.model';
import { PhaseComponentWinnersRepository } from './phase-component-winners/phase-component-winners.repository';
import {
  PhaseComponentItemModel,
  PhaseComponentItemSchema,
} from './phase-component-items/phase-component-item.model';
import { PhaseComponentItemsRepository } from './phase-component-items/phase-component-items.repository';
import {
  PhaseComponentItemTokenModel,
  PhaseComponentItemTokenSchema,
} from './phase-component-item-tokens/phase-component-item-token.model';
import { PhaseComponentItemTokensRepository } from './phase-component-item-tokens/phase-component-item-tokens.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TransferModel.name,
        schema: TransferSchema,
      },
      {
        name: AllowlistModel.name,
        schema: AllowlistRequestSchema,
      },
      {
        name: AllowlistOperationModel.name,
        schema: AllowlistOperationSchema,
      },
      {
        name: AllowlistRunModel.name,
        schema: AllowlistRunSchema,
      },
      {
        name: TransferPoolModel.name,
        schema: TransferPoolSchema,
      },
      {
        name: TransferPoolTransferModel.name,
        schema: TransferPoolTransferSchema,
      },
      {
        name: TokenPoolModel.name,
        schema: TokenPoolSchema,
      },
      {
        name: TokenPoolTokenModel.name,
        schema: TokenPoolTokenSchema,
      },
      {
        name: CustomTokenPoolModel.name,
        schema: CustomTokenPoolSchema,
      },
      {
        name: CustomTokenPoolTokenModel.name,
        schema: CustomTokenPoolTokenSchema,
      },
      {
        name: WalletPoolModel.name,
        schema: WalletPoolSchema,
      },
      {
        name: WalletPoolWalletModel.name,
        schema: WalletPoolWalletSchema,
      },
      {
        name: PhaseModel.name,
        schema: PhaseSchema,
      },
      {
        name: PhaseComponentModel.name,
        schema: PhaseComponentSchema,
      },
      {
        name: PhaseComponentWinnerModel.name,
        schema: PhaseComponentWinnerSchema,
      },
      {
        name: PhaseComponentItemModel.name,
        schema: PhaseComponentItemSchema,
      },
      {
        name: PhaseComponentItemTokenModel.name,
        schema: PhaseComponentItemTokenSchema,
      },
    ]),
  ],
  providers: [
    TransferRepository,
    AllowlistsRepository,
    AllowlistOperationsRepository,
    AllowlistRunsRepository,
    TransferPoolsRepository,
    TransferPoolTransfersRepository,
    TokenPoolsRepository,
    TokenPoolTokensRepository,
    CustomTokenPoolsRepository,
    CustomTokenPoolTokensRepository,
    WalletPoolsRepository,
    WalletPoolWalletsRepository,
    PhasesRepository,
    PhaseComponentsRepository,
    PhaseComponentWinnersRepository,
    PhaseComponentItemsRepository,
    PhaseComponentItemTokensRepository,
  ],
  exports: [
    TransferRepository,
    AllowlistsRepository,
    AllowlistOperationsRepository,
    AllowlistRunsRepository,
    TransferPoolsRepository,
    TransferPoolTransfersRepository,
    TokenPoolsRepository,
    TokenPoolTokensRepository,
    CustomTokenPoolsRepository,
    CustomTokenPoolTokensRepository,
    WalletPoolsRepository,
    WalletPoolWalletsRepository,
    PhasesRepository,
    PhaseComponentsRepository,
    PhaseComponentWinnersRepository,
    PhaseComponentItemsRepository,
    PhaseComponentItemTokensRepository,
  ],
})
export class RepositoriesModule {}
