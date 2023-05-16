import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { AllowlistOperationModel } from './allowlist-operation.model';
import { AllowlistOperationDto } from './allowlist-operation.dto';
import { ModelDto } from '../model.dto';

@Injectable()
export class AllowlistOperationsRepository {
  constructor(
    @InjectModel(AllowlistOperationModel.name)
    private readonly allowlistOperations: Model<AllowlistOperationModel>,
  ) {}

  private mapModelToDto(model: AllowlistOperationModel): AllowlistOperationDto {
    return {
      id: model._id.toString(),
      allowlistId: model.allowlistId,
      createdAt: model.createdAt,
      order: model.order,
      code: model.code,
      params: model.params,
      activeRunId: model.activeRunId,
    };
  }

  async save(
    dto: ModelDto<AllowlistOperationDto>,
    session?: ClientSession,
  ): Promise<AllowlistOperationDto> {
    const model = await this.allowlistOperations.create([dto], { session });
    return this.mapModelToDto(model[0]);
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
    return models.map(this.mapModelToDto);
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

  async setRun(param: {
    allowlistId: string;
    runId: string;
    session: ClientSession;
  }): Promise<void> {
    await this.allowlistOperations.updateMany(
      { allowlistId: param.allowlistId },
      { activeRunId: param.runId },
      { session: param.session },
    );
  }

  async getOperationsForRun(runId: string): Promise<AllowlistOperationDto[]> {
    const models = await this.allowlistOperations.find(
      {
        activeRunId: runId,
      },
      null,
      { sort: { order: 1 } },
    );
    return models.map(this.mapModelToDto);
  }
}
