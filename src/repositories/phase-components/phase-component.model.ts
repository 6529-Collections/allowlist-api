import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PhaseComponentDto } from './phase-component.dto';

@Schema({ collection: 'phase-components' })
export class PhaseComponentModel
  extends Document
  implements Omit<PhaseComponentDto, 'id'>
{
  @Prop({ required: true, type: String })
  readonly allowlistId: string;

  @Prop({ required: true, type: String })
  readonly phaseId: string;

  @Prop({ required: true, type: String })
  readonly componentId: string;

  @Prop({ required: true, type: String })
  readonly activeRunId: string;

  @Prop({ required: true, type: Number })
  readonly insertionOrder: number;

  @Prop({ required: true, type: String })
  readonly name: string;

  @Prop({ required: true, type: String })
  readonly description: string;
}

export const PhaseComponentSchema =
  SchemaFactory.createForClass(PhaseComponentModel);

PhaseComponentSchema.index({ allowlistId: 1 });
