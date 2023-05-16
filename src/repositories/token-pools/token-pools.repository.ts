import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TokenPoolModel } from './token-pool.model';
import { Model } from 'mongoose';
import { TokenPoolDto } from './token-pool.dto';

@Injectable()
export class TokenPoolsRepository {
  constructor(
    @InjectModel(TokenPoolModel.name)
    private readonly tokenPoolModel: Model<TokenPoolModel>,
  ) {}

  private mapModelToDto(model: TokenPoolModel): TokenPoolDto {
    return {
      id: model._id.toString(),
      tokenPoolId: model.tokenPoolId,
      allowlistId: model.allowlistId,
      activeRunId: model.activeRunId,
      transferPoolId: model.transferPoolId,
      name: model.name,
      description: model.description,
      tokenIds: model.tokenIds,
    };
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.tokenPoolModel.deleteMany({ allowlistId });
  }

  async createMany(tokenPools: Omit<TokenPoolDto, 'id'>[]): Promise<void> {
    await this.tokenPoolModel.insertMany(tokenPools, {
      ordered: false,
    });
  }
}
