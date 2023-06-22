import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { AllowlistController } from './allowlist/allowlist.controller';
import { AllowlistOperationService } from './operation/allowlist-operation.service';
import { AllowlistOperationController } from './operation/allowlist-operation.controller';
import { AllowlistLibModule } from '../allowlist-lib/allowlist-lib.module';
import { AllowlistService } from './allowlist/allowlist.service';
import { AllowlistRunController } from './runs/allowlist-run.controller';
import { TransferPoolService } from './transfer-pool/transfer-pool.service';
import { TransferPoolController } from './transfer-pool/transfer-pool.controller';

import { TokenPoolService } from './token-pool/token-pool.service';
import { TokenPoolController } from './token-pool/token-pool.controller';

import { CustomTokenPoolService } from './custom-token-pool/custom-token-pool.service';
import { CustomTokenPoolController } from './custom-token-pool/custom-token-pool.controller';

import { WalletPoolService } from './wallet-pool/wallet-pool.service';
import { WalletPoolController } from './wallet-pool/wallet-pool.controller';

import { PhaseService } from './phase/phase.service';
import { PhaseController } from './phase/phase.controller';

import { PhaseComponentService } from './phase-component/phase-component.service';
import { PhaseComponentController } from './phase-component/phase-component.controller';

import { PhaseComponentItemService } from './phase-component-item/phase-component-item.service';
import { PhaseComponentItemController } from './phase-component-item/phase-component-item.controller';
import { RunnerModule } from '../runner/runner.module';
import { CommonModule } from '../common/common.module';
import { PhaseFullService } from './phase-full/phase-full.service';

import { ResultService } from './result/result.service';
import { ResultController } from './result/result.controller';

// Placeholder for future imports, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE

@Module({
  imports: [RepositoryModule, AllowlistLibModule, RunnerModule, CommonModule],
  providers: [
    AllowlistOperationService,
    AllowlistService,
    TransferPoolService,
    TokenPoolService,
    CustomTokenPoolService,
    WalletPoolService,
    PhaseService,
    PhaseComponentService,
    PhaseComponentItemService,
    PhaseFullService,
    ResultService,
    // Placeholder for future services, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE
  ],
  controllers: [
    AllowlistController,
    AllowlistOperationController,
    AllowlistRunController,
    TransferPoolController,
    TokenPoolController,
    CustomTokenPoolController,
    WalletPoolController,
    PhaseController,
    PhaseComponentController,
    PhaseComponentItemController,
    ResultController,
    // Placeholder for future controllers, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE
  ],
})
export class ApiModule {}
