import { Document } from 'mongoose';
import { AllowlistRunDto, AllowlistRunStatus } from './allowlist-runs.dto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelDto } from '../model.dto';

@Schema({ collection: 'allowlist-runs' })
export class AllowlistRunModel
  extends Document
  implements ModelDto<AllowlistRunDto>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: Number })
  readonly createdAt: number;

  @Prop({ required: false, type: Number })
  readonly claimedAt?: number;

  @Prop({ required: true, type: String, enum: AllowlistRunStatus })
  readonly status: AllowlistRunStatus;
}

export const AllowlistRunSchema =
  SchemaFactory.createForClass(AllowlistRunModel);

AllowlistRunSchema.index({ allowlistId: 1 });
AllowlistRunSchema.index({ status: 1, createdAt: 1 });
