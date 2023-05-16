import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PhaseComponentItemTokenModel } from './phase-component-item-token.model';
import { Model } from 'mongoose';
import { PhaseComponentItemTokenDto } from './phase-component-item-token.dto';

@Injectable()
export class PhaseComponentItemTokensRepository {
  constructor(
    @InjectModel(PhaseComponentItemTokenModel.name)
    private readonly phaseComponentItemTokenModel: Model<PhaseComponentItemTokenModel>,
  ) {}

  private mapModelToDto(
    model: PhaseComponentItemTokenModel,
  ): PhaseComponentItemTokenDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      phaseId: model.phaseId,
      phaseComponentId: model.phaseComponentId,
      phaseComponentItemId: model.phaseComponentItemId,
      tokenId: model.tokenId,
      activeRunId: model.activeRunId,
      owner: model.owner,
      since: model.since,
      order: model.order,
    };
  }

  async createMany(
    tokens: Omit<PhaseComponentItemTokenDto, 'id'>[],
  ): Promise<void> {
    await this.phaseComponentItemTokenModel.insertMany(tokens, {
      ordered: false,
    });
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.phaseComponentItemTokenModel.deleteMany({ allowlistId });
  }
}
