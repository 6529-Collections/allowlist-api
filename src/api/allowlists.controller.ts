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
import { Time } from '../time';
import { AllowlistDescriptionResponseApiModel } from './models/allowlist-description-response-api.model';
import { AllowlistsService } from './services/allowlists.service';
import { AllowlistRunResponseApiModel } from './models/allowlist-run-response-api.model';

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
    return await this.allowlistsService.get(id);
  }

  @ApiOperation({
    summary: 'Run allowlist',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
    isArray: true,
  })
  @Post(':id/runs')
  async run(@Param('id') id: string): Promise<AllowlistRunResponseApiModel> {
    return await this.allowlistsService.run(id);
  }
}
