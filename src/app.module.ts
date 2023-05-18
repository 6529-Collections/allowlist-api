import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AllowlistLibModule } from './allowlist-lib/allowlist-lib.module';
import { ApiModule } from './api/api.module';
import { RunsModule } from './runs/runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.ALLOWLIST_DB_CONNECTION_URI,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 5 * 60 * 1000, // 5min
      }),
    }),
    ApiModule,
    AllowlistLibModule,
    RunsModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
