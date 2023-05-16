import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PhaseComponentWinnerModel } from './phase-component-winner.model';
import { Model } from 'mongoose';
import { PhaseComponentWinnerDto } from './phase-component-winner.dto';

@Injectable()
export class PhaseComponentWinnersRepository {
  constructor(
    @InjectModel(PhaseComponentWinnerModel.name)
    private readonly phaseComponentWinnerModel: Model<PhaseComponentWinnerModel>,
  ) {}

  private mapModelToDto(
    model: PhaseComponentWinnerModel,
  ): PhaseComponentWinnerDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      phaseId: model.phaseId,
      componentId: model.componentId,
      activeRunId: model.activeRunId,
      wallet: model.wallet,
      amount: model.amount,
    };
  }

  async createMany(
    winners: Omit<PhaseComponentWinnerDto, 'id'>[],
  ): Promise<void> {
    await this.phaseComponentWinnerModel.insertMany(winners, {
      ordered: false,
    });
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.phaseComponentWinnerModel.deleteMany({ allowlistId });
  }
}
