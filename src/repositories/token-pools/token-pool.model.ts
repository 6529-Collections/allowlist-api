import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TokenPoolDto } from './token-pool.dto';

@Schema({ collection: 'token-pools' })
export class TokenPoolModel
  extends Document
  implements Omit<TokenPoolDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly tokenPoolId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: String })
  readonly name: string;

  @Prop({ required: true, type: String })
  readonly description: string;

  @Prop({ required: true, type: String })
  readonly transferPoolId: string;

  @Prop({ required: false, type: String })
  readonly tokenIds?: string;
}

export const TokenPoolSchema = SchemaFactory.createForClass(TokenPoolModel);

TokenPoolSchema.index({ allowlistId: 1 });
