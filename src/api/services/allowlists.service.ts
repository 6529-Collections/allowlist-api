import { BadRequestException, Injectable } from '@nestjs/common';
import { AllowlistsRepository } from '../../repositories/allowlist/allowlists.repository';
import { AllowlistDescriptionRequestApiModel } from '../models/allowlist-description-request-api.model';
import { AllowlistDescriptionResponseApiModel } from '../models/allowlist-description-response-api.model';
import { Time } from '../../time';
import { AllowlistRunResponseApiModel } from '../models/allowlist-run-response-api.model';
import { AllowlistRunsRepository } from '../../repositories/allowlist-runs/allowlist-runs.repository';

@Injectable()
export class AllowlistsService {
  constructor(
    private readonly allowlistsRepository: AllowlistsRepository,
    private readonly allowlistRunsRepository: AllowlistRunsRepository,
  ) {}

  async create(
    param: AllowlistDescriptionRequestApiModel,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    return this.allowlistsRepository.save({
      ...param,
      createdAt: Time.currentMillis(),
    });
  }

  async get(id: string): Promise<AllowlistDescriptionResponseApiModel> {
    const entity = await this.allowlistsRepository.findById(id);
    if (!entity) {
      throw new BadRequestException(`Allowlist with ID ${id} does not exist`);
    }
    return entity;
  }

  async run(allowlistId: string): Promise<AllowlistRunResponseApiModel> {
    const entity = await this.allowlistsRepository.findById(allowlistId);
    if (!entity) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }
    return await this.allowlistRunsRepository.save(allowlistId);
  }
}
