import { Logger, Module } from '@nestjs/common';
import { TransferRepository } from './transfer/transfer.repository';
import { AllowlistRepository } from './allowlist/allowlist.repository';
import { AllowlistOperationRepository } from './allowlist-operation/allowlist-operation.repository';
import { TransferPoolRepository } from './transfer-pool/transfer-pool.repository';
import { TokenPoolRepository } from './token-pool/token-pool.repository';
import { CustomTokenPoolRepository } from './custom-token-pool/custom-token-pool.repository';
import { WalletPoolRepository } from './wallet-pool/wallet-pool.repository';
import { PhaseRepository } from './phase/phase.repository';
import { PhaseComponentRepository } from './phase-components/phase-component.repository';
import { PhaseComponentWinnerRepository } from './phase-component-winner/phase-component-winner.repository';
import { PhaseComponentItemRepository } from './phase-component-item/phase-component-item.repository';
import { ConfigService } from '@nestjs/config';
import { APP_POOL } from './db.constants';
import * as mariadb from 'mariadb';
import { DB } from './db';

@Module({
  providers: [
    {
      provide: APP_POOL,
      useFactory: async (
        configService: ConfigService,
      ): Promise<mariadb.Pool> => {
        const config = {
          host: configService.get('DB_HOST'),
          user: configService.get('DB_USER'),
          port: +configService.get('DB_PORT'),
          database: configService.get('DB_NAME'),
          password: configService.get('DB_PASSWORD'),
          connectionLimit: 5,
        };
        const pool = await mariadb.createPool(config);
        new Logger(APP_POOL).log(`Pool created`);
        return pool;
      },
      inject: [ConfigService],
    },
    DB,
    TransferRepository,
    AllowlistRepository,
    AllowlistOperationRepository,
    TransferPoolRepository,
    TokenPoolRepository,
    CustomTokenPoolRepository,
    WalletPoolRepository,
    PhaseRepository,
    PhaseComponentRepository,
    PhaseComponentWinnerRepository,
    PhaseComponentItemRepository,
  ],
  exports: [
    TransferRepository,
    AllowlistRepository,
    AllowlistOperationRepository,
    TransferPoolRepository,
    TokenPoolRepository,
    CustomTokenPoolRepository,
    WalletPoolRepository,
    PhaseRepository,
    PhaseComponentRepository,
    PhaseComponentWinnerRepository,
    PhaseComponentItemRepository,
    DB,
  ],
})
export class RepositoryModule {}
