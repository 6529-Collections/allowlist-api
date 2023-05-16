import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PhaseComponentItemModel } from './phase-component-item.model';
import { Model } from 'mongoose';
import { PhaseComponentItemDto } from './phase-component-item.dto';

@Injectable()
export class PhaseComponentItemsRepository {
  constructor(
    @InjectModel(PhaseComponentItemModel.name)
    private readonly phaseComponentItemModel: Model<PhaseComponentItemModel>,
  ) {}

  private mapModelToDto(model: PhaseComponentItemModel): PhaseComponentItemDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      phaseId: model.phaseId,
      phaseComponentId: model.phaseComponentId,
      phaseComponentItemId: model.phaseComponentItemId,
      activeRunId: model.activeRunId,
      insertionOrder: model.insertionOrder,
      name: model.name,
      description: model.description,
    };
  }

  async createMany(items: Omit<PhaseComponentItemDto, 'id'>[]): Promise<void> {
    await this.phaseComponentItemModel.insertMany(items, {
      ordered: false,
    });
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.phaseComponentItemModel.deleteMany({ allowlistId });
  }
}
