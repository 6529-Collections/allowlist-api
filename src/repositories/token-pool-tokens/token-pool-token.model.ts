import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TokenPoolTokenDto } from './token-pool-token.dto';

@Schema({ collection: 'token-pool-tokens' })
export class TokenPoolTokenModel
  extends Document
  implements Omit<TokenPoolTokenDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly tokenPoolId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: Number })
  readonly order: number;

  @Prop({ required: true, type: String })
  readonly tokenId: string;

  @Prop({ required: true, type: String })
  readonly contract: string;

  @Prop({ required: true, type: String })
  readonly owner: string;

  @Prop({ required: true, type: Number })
  readonly since: number;
}

export const TokenPoolTokenSchema =
  SchemaFactory.createForClass(TokenPoolTokenModel);

TokenPoolTokenSchema.index({ allowlistId: 1 });
