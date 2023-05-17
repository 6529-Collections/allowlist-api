import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AllowlistDescriptionRequestApiModel } from './models/allowlist-description-request-api.model';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { AllowlistsService } from './allowlists.service';
import { AllowlistDescriptionResponseApiModel } from './models/allowlist-description-response-api.model';

@Controller('/allowlists')
export class AllowlistsController {
  constructor(private readonly allowlistsService: AllowlistsService) {}

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
    return await this.allowlistsService.create(request);
  }

  @ApiOperation({
    summary: 'Get all allowlists',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
    isArray: true,
  })
  @Get()
  async getAll(): Promise<AllowlistDescriptionResponseApiModel[]> {
    return await this.allowlistsService.getAll();
  }

  @ApiOperation({
    summary: 'Get allowlist description',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
    isArray: true,
  })
  @Get(':allowlistId')
  async get(
    @Param('allowlistId') allowlistId: string,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    return await this.allowlistsService.get(allowlistId);
  }
}
