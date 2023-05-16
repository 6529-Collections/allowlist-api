import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CustomTokenPoolTokenModel } from './custom-token-pool-token.model';
import { Model } from 'mongoose';
import { CustomTokenPoolTokenDto } from './custom-token-pool-token.dto';

@Injectable()
export class CustomTokenPoolTokensRepository {
  constructor(
    @InjectModel(CustomTokenPoolTokenModel.name)
    private readonly customTokenPoolTokensModel: Model<CustomTokenPoolTokenModel>,
  ) {}

  private mapModelToDto(
    model: CustomTokenPoolTokenModel,
  ): CustomTokenPoolTokenDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      customTokenPoolId: model.customTokenPoolId,
      activeRunId: model.activeRunId,
      order: model.order,
      tokenId: model.tokenId,
      owner: model.owner,
      since: model.since,
    };
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.customTokenPoolTokensModel.deleteMany({ allowlistId });
  }

  async createMany(
    customTokenPoolTokens: Omit<CustomTokenPoolTokenDto, 'id'>[],
  ): Promise<void> {
    await this.customTokenPoolTokensModel.insertMany(customTokenPoolTokens, {
      ordered: false,
    });
  }
}
