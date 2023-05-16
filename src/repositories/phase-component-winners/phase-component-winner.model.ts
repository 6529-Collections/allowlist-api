import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PhaseComponentWinnerDto } from './phase-component-winner.dto';
import { Document } from 'mongoose';

@Schema({ collection: 'phase-component-winners' })
export class PhaseComponentWinnerModel
  extends Document
  implements Omit<PhaseComponentWinnerDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly phaseId: string;

  @Prop({ required: true, type: String })
  readonly componentId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: String })
  readonly wallet: string;

  @Prop({ required: true, type: Number })
  readonly amount: number;
}

export const PhaseComponentWinnerSchema = SchemaFactory.createForClass(
  PhaseComponentWinnerModel,
);

PhaseComponentWinnerSchema.index({ allowlistId: 1 });
