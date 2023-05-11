import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelDto } from '../model.dto';
import { AllowlistDto } from './allowlist.dto';

@Schema({ collection: 'allowlists' })
export class AllowlistModel extends Document implements ModelDto<AllowlistDto> {
  @Prop({ required: true, type: String })
  readonly id: string;

  @Prop({ required: true, type: String })
  readonly description: string;

  @Prop({ required: true, type: String })
  readonly name: string;

  @Prop({ required: true, type: Number })
  readonly createdAt: number;
}

export const AllowlistRequestSchema =
  SchemaFactory.createForClass(AllowlistModel);

AllowlistRequestSchema.index({ id: 1 }, { unique: true });
