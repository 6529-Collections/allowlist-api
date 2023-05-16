import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PhaseDto } from './phase.dto';

@Schema({ collection: 'phases' })
export class PhaseModel extends Document implements Omit<PhaseDto, 'id'> {
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: String })
  readonly phaseId: string;

  @Prop({ required: true, type: String })
  readonly name: string;

  @Prop({ required: true, type: String })
  readonly description: string;

  @Prop({ required: true, type: Number })
  readonly insertionOrder: number;
}

export const PhaseSchema = SchemaFactory.createForClass(PhaseModel);

PhaseSchema.index({ allowlistId: 1 });
