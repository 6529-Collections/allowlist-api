import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TokenPoolModule } from './token-pool/token-pool.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TokenPoolModule],
  controllers: [],
  providers: [],
})
export class TokenDownloaderModule {}
