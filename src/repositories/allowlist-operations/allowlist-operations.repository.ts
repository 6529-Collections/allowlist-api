import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { AllowlistOperationModel } from './allowlist-operation.model';
import { AllowlistOperationDto } from './allowlist-operation.dto';
import { mapModelToDto } from '../model.dto';

@Injectable()
export class AllowlistOperationsRepository {
  constructor(
    @InjectModel(AllowlistOperationModel.name)
    private readonly allowlistOperations: Model<AllowlistOperationModel>,
  ) {}

  async save(
    dto: AllowlistOperationDto,
    session?: ClientSession,
  ): Promise<AllowlistOperationDto> {
    const model = await this.allowlistOperations.create([dto], { session });
    return mapModelToDto(model[0]);
  }

  async getAllRanForAllowlistSinceOrder(
    {
      allowlistId,
      order,
    }: {
      allowlistId: string;
      order: number;
    },
    session?: ClientSession,
  ): Promise<AllowlistOperationDto[]> {
    const models = await this.allowlistOperations.find(
      {
        allowlistId,
        activeRunId: { $ne: null },
        order: { $gte: order },
      },
      null,
      { sort: { order: 1 }, session },
    );
    return models.map(mapModelToDto);
  }

  async updateAllForAllowlistToNeverRan(
    allowlistId: string,
    session?: ClientSession,
  ) {
    await this.allowlistOperations.updateMany(
      { allowlistId },
      { activeRun: null },
      { session },
    );
  }

  async incOrdersForAllowlistSinceOrder(
    param: {
      allowlistId: string;
      sinceOrder: number;
    },
    session?: ClientSession,
  ) {
    await this.allowlistOperations.updateMany(
      { allowlistId: param.allowlistId, order: { $gte: param.sinceOrder } },
      { $inc: { order: 1 } },
      { session },
    );
  }

  async delete(
    { allowlistId, order }: { allowlistId: string; order: number },
    session?: ClientSession,
  ) {
    await this.allowlistOperations.deleteOne(
      { allowlistId, order },
      { session },
    );
  }

  async decOrdersForAllowlistSinceOrder(
    { allowlistId, sinceOrder }: { allowlistId: string; sinceOrder: number },
    session: ClientSession,
  ) {
    await this.allowlistOperations.updateMany(
      { allowlistId, order: { $gte: sinceOrder } },
      { $inc: { order: -1 } },
      { session },
    );
  }
}
