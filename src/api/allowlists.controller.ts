import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { AllowlistDescriptionRequestApiModel } from './models/allowlist-description-request-api.model';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AllowlistsRepository } from '../repositories/allowlist/allowlists.repository';
import { Time } from '../time';
import { AllowlistDescriptionResponseApiModel } from './models/allowlist-description-response-api.model';

@Controller('/allowlists')
export class AllowlistsController {
  constructor(private readonly allowlistsRepository: AllowlistsRepository) {}

  @ApiOperation({
    summary:
      'Create a new allowlist. Supply list of operations in body. ' +
      'This is an async operation. Use GET /allowlist/{allowlist-id} to track the progress and get the end result.',
  })
  @ApiCreatedResponse({
    type: AllowlistDescriptionResponseApiModel,
  })
  @Post()
  async create(
    @Body() request: AllowlistDescriptionRequestApiModel,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    const id = request.id;
    const existingEntity = await this.allowlistsRepository.findById(id);
    if (existingEntity) {
      throw new BadRequestException(`Allowlist with ID ${id} already exists`);
    }
    return this.allowlistsRepository.save({
      ...request,
      createdAt: Time.currentMillis(),
    });
  }

  @ApiOperation({
    summary: 'Get allowlist description',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
    isArray: true,
  })
  @Get(':id')
  async get(
    @Param('id') id: string,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    const entity = await this.allowlistsRepository.findById(id);
    if (!entity) {
      throw new BadRequestException(`Allowlist with ID ${id} does not exist`);
    }
    return entity;
  }
}
