import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TransferPoolTransferDto } from './transfer-pool-transfer.dto';

@Schema({ collection: 'transfer-pool-transfers' })
export class TransferPoolTransferModel
  extends Document
  implements Omit<TransferPoolTransferDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly transferPoolId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: Number })
  readonly order: number;

  @Prop({ required: true, type: String })
  readonly contract: string;

  @Prop({ required: true, type: String })
  readonly tokenID: string;

  @Prop({ required: true, type: Number })
  readonly blockNumber: number;

  @Prop({ required: true, type: Number })
  readonly timeStamp: number;

  @Prop({ required: true, type: Number })
  readonly logIndex: number;

  @Prop({ required: true, type: String })
  readonly from: string;

  @Prop({ required: true, type: String })
  readonly to: string;

  @Prop({ required: true, type: Number })
  readonly amount: number;

  @Prop({ required: true, type: String })
  readonly transactionHash: string;

  @Prop({ required: true, type: Number })
  readonly transactionIndex: number;
}

export const TransferPoolTransferSchema = SchemaFactory.createForClass(
  TransferPoolTransferModel,
);

TransferPoolTransferSchema.index({ activeRunId: 1 });
