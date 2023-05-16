import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AllowlistModel } from './allowlist.model';
import { ClientSession, Model } from 'mongoose';
import { AllowlistDto } from './allowlist.dto';
import { AllowlistRunDto } from '../allowlist-runs/allowlist-runs.dto';

@Injectable()
export class AllowlistsRepository {
  constructor(
    @InjectModel(AllowlistModel.name)
    private readonly allowlistRequests: Model<AllowlistModel>,
  ) {}

  private mapModelToDto(model: AllowlistModel): AllowlistDto {
    return {
      id: model._id.toString(),
      description: model.description,
      name: model.name,
      createdAt: model.createdAt,
      activeRun: model.activeRun,
    };
  }

  async save(request: Omit<AllowlistDto, 'id'>): Promise<AllowlistDto> {
    return this.mapModelToDto(
      await this.allowlistRequests.create({
        description: request.description,
        name: request.name,
        createdAt: request.createdAt,
      }),
    );
  }

  async findById(id: string): Promise<AllowlistDto | null> {
    const model = await this.allowlistRequests.findById(id);
    if (model) {
      return this.mapModelToDto(model);
    }
    return null;
  }

  async setRun(param: {
    id: string;
    runId: string;
    runCreatedAt: number;
    session?: ClientSession;
  }): Promise<AllowlistDto | null> {
    const allowlist = await this.allowlistRequests.findOneAndUpdate(
      {
        _id: param.id,
        // $or: [
        //   { activeRun: null },
        //   { 'activeRun.createdAt': { $lt: param.runCreatedAt } },
        // ],
      },
      { activeRun: { id: param.runId, createdAt: param.runCreatedAt } },
      { new: true, session: param.session },
    );

    if (allowlist) {
      return this.mapModelToDto(allowlist);
    }
    return null;
  }

  
}
