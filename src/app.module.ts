import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AllowlistLibModule } from './allowlist-lib/allowlist-lib.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.DB_CONNECTION_URI),
    ApiModule,
    AllowlistLibModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
