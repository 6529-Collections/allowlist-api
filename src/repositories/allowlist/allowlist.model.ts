import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AllowlistDto } from './allowlist.dto';

@Schema({ collection: 'allowlists' })
export class AllowlistModel
  extends Document
  implements Omit<AllowlistDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly description: string;

  @Prop({ required: true, type: String })
  readonly name: string;

  @Prop({ required: true, type: Number })
  readonly createdAt: number;

  @Prop({ required: false, type: Object })
  readonly activeRun?: { id: string; createdAt: number };
}

export const AllowlistRequestSchema =
  SchemaFactory.createForClass(AllowlistModel);
