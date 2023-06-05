import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PhaseComponentItemDto } from './phase-component-item.dto';
import { Pool } from '@6529-collections/allowlist-lib/app-types';

@Schema({ collection: 'phase-component-items' })
export class PhaseComponentItemModel
  extends Document
  implements Omit<PhaseComponentItemDto, 'id'>
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
  readonly activeRunId: string;

  @Prop({ required: true, type: Number })
  readonly insertionOrder: number;

  @Prop({ required: true, type: String })
  readonly name: string;

  @Prop({ required: true, type: String })
  readonly description: string;

  @Prop({ required: true, type: String })
  readonly poolId: string;

  @Prop({ required: true, type: String, enum: Pool })
  readonly poolType: Pool;
}

export const PhaseComponentItemSchema = SchemaFactory.createForClass(
  PhaseComponentItemModel,
);

PhaseComponentItemSchema.index({ allowlistId: 1 });
