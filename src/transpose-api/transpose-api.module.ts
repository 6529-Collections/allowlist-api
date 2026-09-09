import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TransposeApiService } from './transpose-api.service';
import { TransposeConfig } from './transpose.config';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: TransposeConfig,
      useFactory: (configService: ConfigService): TransposeConfig => {
        const key = configService.get('ALLOWLIST_TRANSPOSE_KEY');
        if (!key) throw new Error('ALLOWLIST_TRANSPOSE_KEY is not set');
        return new TransposeConfig({
          key: key,
        });
      },
      inject: [ConfigService],
    },
    TransposeApiService,
  ],
  exports: [TransposeApiService],
})
export class TransposeApiModule {}
