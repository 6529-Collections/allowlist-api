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

  async getByPhaseId(param: {
    allowlistId: string;
    phaseId: string;
  }): Promise<PhaseComponentDto[]> {
    const { allowlistId, phaseId } = param;
    const models = await this.phaseComponentModel.find({
      allowlistId,
      phaseId,
    });
    return models.map((model) => this.mapModelToDto(model));
  }

  async getAllowlistPhaseComponent(param: {
    allowlistId: string;
    phaseId: string;
    componentId: string;
  }): Promise<PhaseComponentDto | null> {
    const { allowlistId, phaseId, componentId } = param;
    const model = await this.phaseComponentModel.findOne({
      allowlistId,
      phaseId,
      componentId,
    });
    return model ? this.mapModelToDto(model) : null;
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

  async getByAllowlistId(allowlistId: string): Promise<PhaseComponentDto[]> {
    const models = await this.phaseComponentModel.find({ allowlistId });
    return models.map((model) => this.mapModelToDto(model));
  }
}
