import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TokenPoolTokenModel } from './token-pool-token.model';
import { Model } from 'mongoose';
import { TokenPoolTokenDto } from './token-pool-token.dto';

@Injectable()
export class TokenPoolTokensRepository {
  constructor(
    @InjectModel(TokenPoolTokenModel.name)
    private readonly tokenPoolTokensModel: Model<TokenPoolTokenModel>,
  ) {}

  private mapModelToDto(model: TokenPoolTokenModel): TokenPoolTokenDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      tokenPoolId: model.tokenPoolId,
      activeRunId: model.activeRunId,
      order: model.order,
      tokenId: model.tokenId,
      contract: model.contract,
      owner: model.owner,
      since: model.since,
    };
  }

  async deleteByAllowlistId(param: { allowlistId: string }): Promise<void> {
    const { allowlistId } = param;
    await this.tokenPoolTokensModel.deleteMany({ allowlistId });
  }

  async createMany(
    tokenPoolTokens: Omit<TokenPoolTokenDto, 'id'>[],
  ): Promise<void> {
    await this.tokenPoolTokensModel.insertMany(tokenPoolTokens, {
      ordered: false,
    });
  }
}
