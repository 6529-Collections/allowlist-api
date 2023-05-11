import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelDto } from '../model.dto';
import { AllowlistOperationDto } from './allowlist-operation.dto';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';

@Schema({ collection: 'allowlist-operations' })
export class AllowlistOperationModel
  extends Document
  implements ModelDto<AllowlistOperationDto>
{
  @Prop({ required: false, type: String })
  readonly activeRunId?: string;

  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly code: AllowlistOperationCode;

  @Prop({ required: true, type: Number })
  readonly createdAt: number;

  @Prop({ required: true, type: Number })
  readonly order: number;

  @Prop({ required: true, type: Object })
  readonly params: any;
}

export const AllowlistOperationSchema = SchemaFactory.createForClass(
  AllowlistOperationModel,
);

AllowlistOperationSchema.index({ order: 1, allowlistId: 1 });
