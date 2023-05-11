import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { AllowlistDescriptionApiModel } from './models/allowlist-description-api.model';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AllowlistRequestRepository } from '../repositories/allowlist/allowlist-request.repository';
import { DescribableEntity } from '@6529-collections/allowlist-lib/allowlist/state-types/describable-entity';
import { Time } from '../time';

@Controller('/allowlist')
export class AllowlistController {
  constructor(
    private readonly allowlistRequestRepository: AllowlistRequestRepository,
  ) {}

  @ApiOperation({
    summary:
      'Create a new allowlist. Supply list of operations in body. ' +
      'This is an async operation. Use GET /allowlist/{allowlist-id} to track the progress and get the end result.',
  })
  @ApiCreatedResponse({
    type: AllowlistDescriptionApiModel,
  })
  @Post()
  async create(
    @Body() request: AllowlistDescriptionApiModel,
  ): Promise<DescribableEntity> {
    const id = request.id;
    const existingEntity = await this.allowlistRequestRepository.findById(id);
    if (existingEntity) {
      throw new BadRequestException(`Allowlist with ID ${id} already exists`);
    }
    return this.allowlistRequestRepository.save({
      ...request,
      createdAt: Time.currentMillis(),
    });
  }

  @ApiOperation({
    summary: 'Get allowlist description',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionApiModel,
    isArray: true,
  })
  @Get(':id')
  async get(@Param('id') id: string): Promise<DescribableEntity> {
    const entity = await this.allowlistRequestRepository.findById(id);
    if (!entity) {
      throw new BadRequestException(`Allowlist with ID ${id} does not exist`);
    }
    return entity;
  }
}
