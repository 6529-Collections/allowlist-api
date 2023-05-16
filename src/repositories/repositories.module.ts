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
  ],
})
export class RepositoriesModule {}
