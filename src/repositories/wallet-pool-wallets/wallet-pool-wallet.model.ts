import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WalletPoolWalletDto } from './wallet-pool-wallet.dto';

@Schema({ collection: 'wallet-pool-wallets' })
export class WalletPoolWalletModel
  extends Document
  implements Omit<WalletPoolWalletDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: String })
  readonly walletPoolId: string;

  @Prop({ required: true, type: String })
  readonly wallet: string;
}

export const WalletPoolWalletSchema = SchemaFactory.createForClass(
  WalletPoolWalletModel,
);

WalletPoolWalletSchema.index({ allowlistId: 1 });
