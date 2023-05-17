import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PhaseModel } from './phase.model';
import { Model } from 'mongoose';
import { PhaseDto } from './phase.dto';

@Injectable()
export class PhasesRepository {
  constructor(
    @InjectModel(PhaseModel.name)
    private readonly phaseModel: Model<PhaseModel>,
  ) {}

  private mapModelToDto(model: PhaseModel): PhaseDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      activeRunId: model.activeRunId,
      phaseId: model.phaseId,
      name: model.name,
      description: model.description,
      insertionOrder: model.insertionOrder,
    };
  }

  async getByAllowlistId(allowlistId: string): Promise<PhaseDto[]> {
    const models = await this.phaseModel.find({ allowlistId });
    return models.map((model) => this.mapModelToDto(model));
  }

  async getAllowlistPhase(param: {
    allowlistId: string;
    phaseId: string;
  }): Promise<PhaseDto | null> {
    const { allowlistId, phaseId } = param;
    const model = await this.phaseModel.findOne({
      phaseId,
      allowlistId,
    });
    return model ? this.mapModelToDto(model) : null;
  }

  async createMany(phases: Omit<PhaseDto, 'id'>[]): Promise<void> {
    await this.phaseModel.insertMany(phases, {
      ordered: false,
    });
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    await this.phaseModel.deleteMany(param);
  }
}
