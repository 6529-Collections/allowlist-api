import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alchemy, Network } from 'alchemy-sdk';
import { AlchemyApiService } from './alchemy-api.service';

@Module({
  imports: [],
  providers: [
    {
      provide: Alchemy,
      useFactory: (configService: ConfigService): Alchemy => {
        const alchemyApiKey = configService.get('ALLOWLIST_ALCHEMY_API_KEY');
        if (!alchemyApiKey)
          throw new Error('ALLOWLIST_ALCHEMY_API_KEY is not set');
        return new Alchemy({
          apiKey: alchemyApiKey,
          network: Network.ETH_MAINNET,
        });
      },
      inject: [ConfigService],
    },
    AlchemyApiService,
  ],
  exports: [AlchemyApiService, Alchemy],
})
export class AlchemyApiModule {}
