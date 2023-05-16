import { Transfer } from '@6529-collections/allowlist-lib/allowlist/state-types/transfer';
import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'transfers' })
export class TransferModel extends Document implements Transfer {
  @Prop({ required: true, type: Number })
  readonly amount: number;
  @Prop({ required: true, type: Number })
  readonly blockNumber: number;
  @Prop({ required: true, type: String })
  readonly contract: string;
  @Prop({ required: true, type: String })
  readonly from: string;
  @Prop({ required: true, type: Number })
  readonly logIndex: number;
  @Prop({ required: true, type: Number })
  readonly timeStamp: number;
  @Prop({ required: true, type: String })
  readonly to: string;
  @Prop({ required: true, type: String })
  readonly tokenID: string;
  @Prop({ required: true, type: String })
  readonly transactionHash: string;
  @Prop({ required: true, type: Number })
  readonly transactionIndex: number;
}

export const TransferSchema = SchemaFactory.createForClass(TransferModel);

TransferSchema.index({ contract: 1 });
TransferSchema.index({
  contract: 1,
  blockNumber: 1,
  transactionIndex: 1,
  logIndex: 1,
});
