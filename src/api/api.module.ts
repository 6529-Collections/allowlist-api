import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AllowlistsController } from './allowlist/allowlists.controller';
import { AllowlistOperationsService } from './operations/allowlist-operations.service';
import { AllowlistOperationsController } from './operations/allowlist-operations.controller';
import { AllowlistLibModule } from '../allowlist-lib/allowlist-lib.module';
import { AllowlistsService } from './allowlist/allowlists.service';
import { AllowlistRunsService } from './runs/allowlist-runs.service';
import { AllowlistRunsController } from './runs/allowlist-runs.controller';
import { TransferPoolsService } from './transfer-pools/transfer-pools.service';
import { TransferPoolsController } from './transfer-pools/transfer-pools.controller';

import { TokenPoolsService } from './token-pools/token-pools.service';
import { TokenPoolsController } from './token-pools/token-pools.controller';

import { CustomTokenPoolsService } from './custom-token-pools/custom-token-pools.service';
import { CustomTokenPoolsController } from './custom-token-pools/custom-token-pools.controller';

import { WalletPoolsService } from './wallet-pools/wallet-pools.service';
import { WalletPoolsController } from './wallet-pools/wallet-pools.controller';

import { PhasesService } from './phases/phases.service';
import { PhasesController } from './phases/phases.controller';

import { PhaseComponentsService } from './phase-components/phase-components.service';
import { PhaseComponentsController } from './phase-components/phase-components.controller';

import { PhaseComponentItemsService } from './phase-component-items/phase-component-items.service';
import { PhaseComponentItemsController } from './phase-component-items/phase-component-items.controller';

// Placeholder for future imports, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE

@Module({
  imports: [RepositoriesModule, AllowlistLibModule],
  providers: [
    AllowlistOperationsService,
    AllowlistsService,
    AllowlistRunsService,
    TransferPoolsService,
    TokenPoolsService,
    CustomTokenPoolsService,
    WalletPoolsService,
    PhasesService,
    PhaseComponentsService,
    PhaseComponentItemsService,
    // Placeholder for future services, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE
  ],
  controllers: [
    AllowlistsController,
    AllowlistOperationsController,
    AllowlistRunsController,
    TransferPoolsController,
    TokenPoolsController,
    CustomTokenPoolsController,
    WalletPoolsController,
    PhasesController,
    PhaseComponentsController,
    PhaseComponentItemsController,
    // Placeholder for future controllers, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE
  ],
})
export class ApiModule {}
