import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TransferPoolDto } from './transfer-pool.dto';

@Schema({ collection: 'transfer-pools' })
export class TransferPoolModel
  extends Document
  implements Omit<TransferPoolDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly transferPoolId: string;

  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly name: string;

  @Prop({ required: true, type: String })
  readonly description: string;

  @Prop({ required: true, type: Number })
  readonly blockNo: number;

  @Prop({ required: true, type: String })
  readonly contract: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;
  
}

export const TransferPoolSchema =
  SchemaFactory.createForClass(TransferPoolModel);

TransferPoolSchema.index({ allowlistId: 1 });
