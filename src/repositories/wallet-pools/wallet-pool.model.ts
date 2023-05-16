import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { WalletPoolDto } from './wallet-pool.dto';
import { Document } from 'mongoose';

@Schema({ collection: 'wallet-pools' })
export class WalletPoolModel
  extends Document
  implements Omit<WalletPoolDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly walletPoolId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: String })
  readonly name: string;

  @Prop({ required: true, type: String })
  readonly description: string;
}

export const WalletPoolSchema = SchemaFactory.createForClass(WalletPoolModel);

WalletPoolSchema.index({ allowlistId: 1 });
