import { BadRequestException, Injectable } from '@nestjs/common';
import { AllowlistsRepository } from '../../repositories/allowlist/allowlists.repository';
import { AllowlistDescriptionRequestApiModel } from './models/allowlist-description-request-api.model';

import { Time } from '../../time';
import { AllowlistDescriptionResponseApiModel } from './models/allowlist-description-response-api.model';
import { isValidMongoId } from '../../app.utils';
import { AllowlistRunsRepository } from '../../repositories/allowlist-runs/allowlist-runs.repository';
import { CommonService } from '../../common/common.service';

@Injectable()
export class AllowlistsService {
  constructor(
    private readonly allowlistsRepository: AllowlistsRepository,
    private readonly allowlistRunsRepository: AllowlistRunsRepository,
    private readonly commonService: CommonService,
  ) {}

  async getAll(): Promise<AllowlistDescriptionResponseApiModel[]> {
    return this.allowlistsRepository.getAll();
  }

  async create(
    param: AllowlistDescriptionRequestApiModel,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    return this.allowlistsRepository.save({
      ...param,
      createdAt: Time.currentMillis(),
    });
  }

  async get(
    allowlistId: string,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    if (!isValidMongoId(allowlistId)) {
      throw new BadRequestException(
        `Allowlist ID ${allowlistId} is not a valid ID`,
      );
    }
    const entity = await this.allowlistsRepository.findById(allowlistId);
    if (!entity) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }
    return entity;
  }

  async delete(allowlistId: string): Promise<void> {
    if (!isValidMongoId(allowlistId)) {
      throw new BadRequestException(
        `Allowlist ID ${allowlistId} is not a valid ID`,
      );
    }
    const entity = await this.allowlistsRepository.findById(allowlistId);
    if (!entity) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }

    const runs = await this.allowlistRunsRepository.getAllForAllowlist(
      allowlistId,
    );
    const haveRunningRuns = runs.some(
      (run) => run.status === 'PENDING' || run.status === 'CLAIMED',
    );

    if (haveRunningRuns) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} has running runs`,
      );
    }

    await this.commonService.deleteAllowlist(allowlistId);
  }
}
