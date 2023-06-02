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

  async getByPhaseComponentId(param: {
    allowlistId: string;
    phaseId: string;
    phaseComponentId: string;
  }): Promise<PhaseComponentItemDto[]> {
    const { allowlistId, phaseId, phaseComponentId } = param;
    const models = await this.phaseComponentItemModel.find({
      allowlistId,
      phaseId,
      phaseComponentId,
    });
    return models.map((model) => this.mapModelToDto(model));
  }

  async getAllowlistPhaseComponentItem(param: {
    allowlistId: string;
    phaseId: string;
    phaseComponentId: string;
    phaseComponentItemId: string;
  }): Promise<PhaseComponentItemDto | null> {
    const { allowlistId, phaseId, phaseComponentId, phaseComponentItemId } =
      param;
    const model = await this.phaseComponentItemModel.findOne({
      allowlistId,
      phaseId,
      phaseComponentId,
      phaseComponentItemId,
    });
    return model ? this.mapModelToDto(model) : null;
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

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<PhaseComponentItemDto[]> {
    const models = await this.phaseComponentItemModel.find({ allowlistId });
    return models.map((model) => this.mapModelToDto(model));
  }
}
