import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CustomTokenPoolModel } from './custom-token-pool.model';
import { Model } from 'mongoose';
import { CustomTokenPoolDto } from './custom-token-pool.dto';

@Injectable()
export class CustomTokenPoolsRepository {
  constructor(
    @InjectModel(CustomTokenPoolModel.name)
    private readonly customTokenPoolModel: Model<CustomTokenPoolModel>,
  ) {}

  private mapModelToDto(model: CustomTokenPoolModel): CustomTokenPoolDto {
    return {
      id: model._id.toString(),
      customTokenPoolId: model.customTokenPoolId,
      allowlistId: model.allowlistId,
      name: model.name,
      description: model.description,
      activeRunId: model.activeRunId,
    };
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.customTokenPoolModel.deleteMany({ allowlistId });
  }

  async createMany(
    customTokenPools: Omit<CustomTokenPoolDto, 'id'>[],
  ): Promise<void> {
    await this.customTokenPoolModel.insertMany(customTokenPools, {
      ordered: false,
    });
  }
}
