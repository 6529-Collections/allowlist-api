import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { ConfigService } from '@nestjs/config';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { TransferRepository } from '../repository/transfer/transfer.repository';
import { AllowlistLibLogListener } from './allowlist-lib-log-listener.service';
import { LoggerFactory } from '@6529-collections/allowlist-lib/logging/logging-emitter';

@Module({
  imports: [RepositoryModule],
  providers: [
    AllowlistLibLogListener,
    {
      provide: AllowlistCreator.name,
      useFactory: (
        configService: ConfigService,
        transferRepository: TransferRepository,
        allowlistLibLogListener: AllowlistLibLogListener,
      ): AllowlistCreator => {
        const etherscanApiKey = configService.get(
          'ALLOWLIST_ETHERSCAN_API_KEY',
        );
        return AllowlistCreator.getInstance({
          etherscanApiKey,
          storage: {
            transfersStorage: transferRepository,
          },
          loggerFactory: new LoggerFactory(allowlistLibLogListener),
        });
      },
      inject: [ConfigService, TransferRepository, AllowlistLibLogListener],
    },
  ],
  exports: [AllowlistCreator.name],
})
export class AllowlistLibModule {}
