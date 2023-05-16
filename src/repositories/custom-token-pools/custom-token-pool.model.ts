import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CustomTokenPoolDto } from './custom-token-pool.dto';

@Schema({ collection: 'custom-token-pools' })
export class CustomTokenPoolModel
  extends Document
  implements Omit<CustomTokenPoolDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly customTokenPoolId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: String })
  readonly name: string;

  @Prop({ required: true, type: String })
  readonly description: string;
}

export const CustomTokenPoolSchema =
  SchemaFactory.createForClass(CustomTokenPoolModel);

CustomTokenPoolSchema.index({ allowlistId: 1 });
