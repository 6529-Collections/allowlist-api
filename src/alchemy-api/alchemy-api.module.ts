import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonRpcProvider } from 'ethers';
import { AlchemyApiClient } from './alchemy-api.client';
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
      provide: AlchemyApiClient,
      useFactory: (
        alchemyConfig: AlchemyConfig,
        httpService: HttpService,
      ): AlchemyApiClient => {
        const provider = new JsonRpcProvider(
          `https://eth-mainnet.g.alchemy.com/v2/${encodeURIComponent(
            alchemyConfig.key,
          )}`,
          'mainnet',
          { staticNetwork: true },
        );
        return new AlchemyApiClient(alchemyConfig, httpService, provider);
      },
      inject: [AlchemyConfig, HttpService],
    },
    AlchemyApiService,
  ],
  exports: [AlchemyApiService, AlchemyConfig, AlchemyApiClient],
})
export class AlchemyApiModule {}
