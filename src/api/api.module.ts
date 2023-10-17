import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { AllowlistController } from './allowlist/allowlist.controller';
import { AllowlistOperationService } from './operation/allowlist-operation.service';
import { AllowlistOperationController } from './operation/allowlist-operation.controller';
import { AllowlistLibModule } from '../allowlist-lib/allowlist-lib.module';
import { AllowlistService } from './allowlist/allowlist.service';
import { AllowlistRunController } from './runs/allowlist-run.controller';
import { TransferPoolService } from './transfer-pool/transfer-pool.service';
import { TransferPoolController } from './transfer-pool/transfer-pool.controller';

import { TokenPoolService } from './token-pool/token-pool.service';
import { TokenPoolController } from './token-pool/token-pool.controller';

import { CustomTokenPoolService } from './custom-token-pool/custom-token-pool.service';
import { CustomTokenPoolController } from './custom-token-pool/custom-token-pool.controller';

import { WalletPoolService } from './wallet-pool/wallet-pool.service';
import { WalletPoolController } from './wallet-pool/wallet-pool.controller';

import { PhaseService } from './phase/phase.service';
import { PhaseController } from './phase/phase.controller';

import { PhaseComponentService } from './phase-component/phase-component.service';
import { PhaseComponentController } from './phase-component/phase-component.controller';

import { PhaseComponentItemService } from './phase-component-item/phase-component-item.service';
import { PhaseComponentItemController } from './phase-component-item/phase-component-item.controller';
import { RunnerModule } from '../runner/runner.module';
import { CommonModule } from '../common/common.module';
import { PhaseFullService } from './phase-full/phase-full.service';

import { ResultService } from './result/result.service';
import { ResultController } from './result/result.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenGuard } from './auth/access-token.guard';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenStrategy } from './auth/access.token.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AUTH_CONFIG, AuthConfig } from './auth/auth.config';
import { Time } from '../time';
import { AuthController } from './auth/auth.controller';
import { TokenPoolModule } from '../token-pool/token-pool.module';
import { TokenPoolDownloadService } from './token-pool-download/token-pool-download.service';
import { TokenPoolDownloadController } from './token-pool-download/token-pool-download.controller';
import { SeizeApiModule } from '../seize-api/seize-api.module';
import { AppLoggerMiddleware } from '../app.logger.middleware';
import * as Sentry from '@sentry/serverless';

// Placeholder for future imports, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    PassportModule,
    RepositoryModule,
    AllowlistLibModule,
    RunnerModule,
    TokenPoolModule,
    CommonModule,
    SeizeApiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: AUTH_CONFIG,
      useFactory: (configService: ConfigService): AuthConfig => ({
        authTokenSecret: configService.get('ALLOWLIST_AUTH_TOKEN_SECRET'),
        refreshTokenSecret: configService.get('ALLOWLIST_REFRESH_TOKEN_SECRET'),
        authTokenExpiry: Time.seconds(
          configService.get<number>('ALLOWLIST_AUTH_TOKEN_EXPIRY_SECONDS') ?? 0,
        ),
        refreshTokenExpiry: Time.seconds(
          configService.get<number>('ALLOWLIST_REFRESH_TOKEN_EXPIRY_SECONDS') ??
            0,
        ),
      }),
      inject: [ConfigService],
    },
    AccessTokenStrategy,
    AllowlistOperationService,
    AllowlistService,
    TransferPoolService,
    TokenPoolService,
    TokenPoolDownloadService,
    CustomTokenPoolService,
    WalletPoolService,
    PhaseService,
    PhaseComponentService,
    PhaseComponentItemService,
    PhaseFullService,
    ResultService,
    // Placeholder for future services, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE
  ],
  controllers: [
    AllowlistController,
    AllowlistOperationController,
    AllowlistRunController,
    TransferPoolController,
    TokenPoolController,
    TokenPoolDownloadController,
    CustomTokenPoolController,
    WalletPoolController,
    PhaseController,
    PhaseComponentController,
    PhaseComponentItemController,
    ResultController,
    AuthController,
    // Placeholder for future controllers, please do not remove (auto-generated) - DO NOT REMOVE THIS LINE
  ],
})
export class ApiModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
