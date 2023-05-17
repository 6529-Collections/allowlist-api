import { BadRequestException, Injectable } from '@nestjs/common';
import { AllowlistsRepository } from '../../repositories/allowlist/allowlists.repository';
import { AllowlistDescriptionRequestApiModel } from './models/allowlist-description-request-api.model';

import { Time } from '../../time';
import { AllowlistDescriptionResponseApiModel } from './models/allowlist-description-response-api.model';

@Injectable()
export class AllowlistsService {
  constructor(private readonly allowlistsRepository: AllowlistsRepository) {}

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
    const entity = await this.allowlistsRepository.findById(allowlistId);
    if (!entity) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }
    return entity;
  }
}
