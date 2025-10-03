import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alchemy, Network } from 'alchemy-sdk';
import { AlchemyApiService } from './alchemy-api.service';
import { AlchemyConfig } from './alchemy.config';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: AlchemyConfig,
      useFactory: (configService: ConfigService): AlchemyConfig => {
        const alchemyApiKey = configService.get('ALLOWLIST_ALCHEMY_API_KEY');
        if (!alchemyApiKey)
          throw new Error('ALLOWLIST_ALCHEMY_API_KEY is not set');
        return new AlchemyConfig({
          key: alchemyApiKey,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: Alchemy,
      useFactory: (alchemyConfig: AlchemyConfig): Alchemy => {
        return new Alchemy({
          apiKey: alchemyConfig.key,
          network: Network.ETH_MAINNET,
        });
      },
      inject: [AlchemyConfig],
    },
    AlchemyApiService,
  ],
  exports: [AlchemyApiService, AlchemyConfig, Alchemy],
})
export class AlchemyApiModule {}
