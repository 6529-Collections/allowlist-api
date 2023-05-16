import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PhaseComponentModel } from './phase-component.model';
import { Model } from 'mongoose';
import { PhaseComponentDto } from './phase-component.dto';

@Injectable()
export class PhaseComponentsRepository {
  constructor(
    @InjectModel(PhaseComponentModel.name)
    private readonly phaseComponentModel: Model<PhaseComponentModel>,
  ) {}

  private mapModelToDto(model: PhaseComponentModel): PhaseComponentDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      phaseId: model.phaseId,
      componentId: model.componentId,
      activeRunId: model.activeRunId,
      insertionOrder: model.insertionOrder,
      name: model.name,
      description: model.description,
    };
  }

  async createMany(components: Omit<PhaseComponentDto, 'id'>[]): Promise<void> {
    await this.phaseComponentModel.insertMany(components, {
      ordered: false,
    });
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.phaseComponentModel.deleteMany({ allowlistId });
  }
}
