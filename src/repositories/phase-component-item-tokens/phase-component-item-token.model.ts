import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PhaseComponentItemTokenDto } from './phase-component-item-token.dto';

@Schema({ collection: 'phase-component-item-tokens' })
export class PhaseComponentItemTokenModel
  extends Document
  implements Omit<PhaseComponentItemTokenDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly phaseId: string;

  @Prop({ required: true, type: String })
  readonly phaseComponentId: string;

  @Prop({ required: true, type: String })
  readonly phaseComponentItemId: string;

  @Prop({ required: true, type: String })
  readonly tokenId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: String })
  readonly owner: string;

  @Prop({ required: true, type: Number })
  readonly since: number;

  @Prop({ required: true, type: Number })
  readonly order: number;
}

export const PhaseComponentItemTokenSchema = SchemaFactory.createForClass(
  PhaseComponentItemTokenModel,
);

PhaseComponentItemTokenSchema.index({ allowlistId: 1 });
