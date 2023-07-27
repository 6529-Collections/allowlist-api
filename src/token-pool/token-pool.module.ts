import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { TokenPoolDownloaderService } from './token-pool-downloader.service';
import { TokenPoolAsyncDownloader } from './token-pool-async-downloader';
import { AllowlistLibModule } from '../allowlist-lib/allowlist-lib.module';
import { SnsModule } from '../sns/sns.module';
import { AlchemyApiModule } from '../alchemy-api/alchemy-api.module';

@Module({
  imports: [RepositoryModule, AllowlistLibModule, SnsModule, AlchemyApiModule],
  providers: [TokenPoolDownloaderService, TokenPoolAsyncDownloader],
  exports: [TokenPoolAsyncDownloader],
})
export class TokenPoolModule {}
