import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CustomTokenPoolTokenDto } from './custom-token-pool-token.dto';

@Schema({ collection: 'custom-token-pool-tokens' })
export class CustomTokenPoolTokenModel
  extends Document
  implements Omit<CustomTokenPoolTokenDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly customTokenPoolId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: Number })
  readonly order: number;

  @Prop({ required: true, type: String })
  readonly tokenId: string;

  @Prop({ required: true, type: String })
  readonly owner: string;

  @Prop({ required: true, type: Number })
  readonly since: number;
}

export const CustomTokenPoolTokenSchema = SchemaFactory.createForClass(
  CustomTokenPoolTokenModel,
);

CustomTokenPoolTokenSchema.index({ allowlistId: 1 });
