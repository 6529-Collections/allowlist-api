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

@Module({
  imports: [RepositoryModule, AlchemyApiModule],
  providers: [
    AllowlistLibLogListener,
    {
      provide: AllowlistCreator.name,
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
        return AllowlistCreator.getInstance({
          seizeApiPath: configService.get('ALLOWLIST_SEIZE_API_PATH'),
          seizeApiKey: configService.get('ALLOWLIST_SEIZE_API_KEY'),
          alchemy,
          etherscanApiKey,
          storage: {
            transfersStorage: transferRepository,
            tokenPoolStorage: tokenPoolTokenRepository,
          },
          loggerFactory: new LoggerFactory(allowlistLibLogListener),
        });
      },
      inject: [
        ConfigService,
        TransferRepository,
        TokenPoolTokenRepository,
        AllowlistLibLogListener,
        Alchemy.name,
      ],
    },
  ],
  exports: [AllowlistCreator.name],
})
export class AllowlistLibModule {}
