import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { ConfigService } from '@nestjs/config';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { TransferRepository } from '../repository/transfer/transfer.repository';
import { AllowlistLibLogListener } from './allowlist-lib-log-listener.service';
import { LoggerFactory } from '@6529-collections/allowlist-lib/logging/logging-emitter';
import { AlchemyApiModule } from '../alchemy-api/alchemy-api.module';
import { Alchemy } from 'alchemy-sdk';
import { TokenPoolTokenRepository } from '../repository/token-pool-token/token-pool-token.repository';
import { EtherscanService } from '@6529-collections/allowlist-lib/services/etherscan.service';
import { AllowlistLibExecutionContextService } from './allowlist-lib-execution-context.service';
import {
  parseTimeoutMs,
  patchAllowlistCreatorSeizeApi,
} from './allowlist-lib-seize-timeout-patch';

@Module({
  imports: [RepositoryModule, AlchemyApiModule],
  providers: [
    AllowlistLibExecutionContextService,
    AllowlistLibLogListener,
    {
      provide: AllowlistCreator,
      useFactory: (
        configService: ConfigService,
        transferRepository: TransferRepository,
        tokenPoolTokenRepository: TokenPoolTokenRepository,
        allowlistLibLogListener: AllowlistLibLogListener,
        alchemy: Alchemy,
      ): AllowlistCreator => {
        const etherscanApiKey = configService.get(
          'ALLOWLIST_ETHERSCAN_API_KEY',
        );
        const loggerFactory = new LoggerFactory(allowlistLibLogListener);
        const allowlistCreator = AllowlistCreator.getInstance({
          seizeApiPath: configService.get('ALLOWLIST_SEIZE_API_PATH'),
          seizeApiKey: configService.get('ALLOWLIST_SEIZE_API_KEY'),
          alchemy,
          etherscanApiKey,
          storage: {
            transfersStorage: transferRepository,
            tokenPoolStorage: tokenPoolTokenRepository,
          },
          loggerFactory,
        });
        patchAllowlistCreatorSeizeApi({
          allowlistCreator,
          loggerFactory,
          seizeMetadataTimeoutMs: parseTimeoutMs(
            configService.get('ALLOWLIST_SEIZE_METADATA_TIMEOUT_MS'),
            10000,
          ),
          arweaveDownloadTimeoutMs: parseTimeoutMs(
            configService.get('ALLOWLIST_ARWEAVE_DOWNLOAD_TIMEOUT_MS'),
            30000,
          ),
        });
        return allowlistCreator;
      },
      inject: [
        ConfigService,
        TransferRepository,
        TokenPoolTokenRepository,
        AllowlistLibLogListener,
        Alchemy,
      ],
    },

    {
      provide: EtherscanService,
      useFactory: (allowlistCreator: AllowlistCreator): EtherscanService =>
        allowlistCreator.etherscanService,
      inject: [AllowlistCreator],
    },
  ],
  exports: [
    AllowlistCreator,
    EtherscanService,
    AllowlistLibExecutionContextService,
  ],
})
export class AllowlistLibModule {}
