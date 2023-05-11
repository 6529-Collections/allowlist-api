import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { ConfigService } from '@nestjs/config';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { TransferRepository } from '../repositories/transfer/transfer.repository';
import { AllowlistLibLogListener } from './allowlist-lib-log-listener.service';
import { LoggerFactory } from '@6529-collections/allowlist-lib/logging/logging-emitter';

@Module({
  imports: [RepositoriesModule],
  providers: [
    AllowlistLibLogListener,
    {
      provide: AllowlistCreator.name,
      useFactory: (
        configService: ConfigService,
        transferRepository: TransferRepository,
        allowlistLibLogListener: AllowlistLibLogListener,
      ): AllowlistCreator => {
        return AllowlistCreator.getInstance({
          etherscanApiKey: configService.get('ETHERSCAN_API_KEY'),
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
