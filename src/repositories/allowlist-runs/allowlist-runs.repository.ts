import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AllowlistRunModel } from './allowlist-runs.model';
import { Model } from 'mongoose';
import { AllowlistRunDto, AllowlistRunStatus } from './allowlist-runs.dto';
import { Time } from '../../time';

@Injectable()
export class AllowlistRunsRepository {
  constructor(
    @InjectModel(AllowlistRunModel.name)
    private readonly allowlistRuns: Model<AllowlistRunModel>,
  ) {}

  private mapModelToDto(model: AllowlistRunModel): AllowlistRunDto {
    return {
      id: model._id.toString(),
      createdAt: model.createdAt,
      allowlistId: model.allowlistId,
      claimedAt: model.claimedAt,
      status: model.status,
    };
  }

  async save(allowlistId: string): Promise<AllowlistRunDto> {
    return this.mapModelToDto(
      await this.allowlistRuns.create({
        allowlistId,
        createdAt: Time.currentMillis(),
        status: AllowlistRunStatus.PENDING,
      }),
    );
  }

  async findById(runId: string): Promise<AllowlistRunDto | null> {
    const model = await this.allowlistRuns.findById(runId);
    if (model) {
      return this.mapModelToDto(model);
    }
    return null;
  }

  async getAllForAllowlist(allowlistId: string): Promise<AllowlistRunDto[]> {
    return this.allowlistRuns
      .find({ allowlistId })
      .sort({ createdAt: -1 })
      .then((models) => models.map(this.mapModelToDto));
  }

  async claim(): Promise<AllowlistRunDto | null> {
    const model = await this.allowlistRuns.findOneAndUpdate(
      {
        status: AllowlistRunStatus.PENDING,
      },
      {
        claimedAt: Time.currentMillis(),
        status: AllowlistRunStatus.CLAIMED,
      },
      { sort: { status: 1, createdAt: 1 }, hint: { status: 1, createdAt: 1 } },
    );
    if (model) {
      return this.mapModelToDto(model);
    }
    return null;
  }

  async complete(runId: string): Promise<AllowlistRunDto | null> {
    const model = await this.allowlistRuns.findOneAndUpdate(
      {
        _id: runId,
        status: AllowlistRunStatus.CLAIMED,
      },
      {
        status: AllowlistRunStatus.COMPLETED,
      },
    );
    if (model) {
      return this.mapModelToDto(model);
    }
    return null;
  }

  async fail(runId: string): Promise<AllowlistRunDto | null> {
    const model = await this.allowlistRuns.findOneAndUpdate(
      {
        _id: runId,
        status: AllowlistRunStatus.CLAIMED,
      },
      {
        status: AllowlistRunStatus.FAILED,
      },
    );
    if (model) {
      return this.mapModelToDto(model);
    }
    return null;
  }
}
