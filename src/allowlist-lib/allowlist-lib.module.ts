import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { ConfigService } from '@nestjs/config';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { TransferRepository } from '../repositories/transfer/transfer.repository';

@Module({
  imports: [RepositoriesModule],
  providers: [
    {
      provide: AllowlistCreator.name,
      useFactory: (
        configService: ConfigService,
        transferRepository: TransferRepository,
      ): AllowlistCreator => {
        return AllowlistCreator.getInstance({
          etherscanApiKey: configService.get('ETHERSCAN_API_KEY'),
          storage: {
            transfersStorage: transferRepository,
          },
        });
      },
      inject: [ConfigService, TransferRepository],
    },
  ],
  exports: [AllowlistCreator.name],
})
export class AllowlistLibModule {}
