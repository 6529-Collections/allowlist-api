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

  async createMany(phases: Omit<PhaseDto, 'id'>[]): Promise<void> {
    await this.phaseModel.insertMany(phases, {
      ordered: false,
    });
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    await this.phaseModel.deleteMany(param);
  }
}
