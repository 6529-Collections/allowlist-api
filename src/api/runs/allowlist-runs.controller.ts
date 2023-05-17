import { Controller, Get, Param, Post } from '@nestjs/common';
import { AllowlistRunsService } from './allowlist-runs.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AllowlistDescriptionRequestApiModel } from '../allowlist/models/allowlist-description-request-api.model';
import { AllowlistRunResponseApiModel } from './models/allowlist-run-response-api.model';

@Controller('/allowlists/:allowlistId/runs')
export class AllowlistRunsController {
  constructor(private readonly allowlistRunsService: AllowlistRunsService) {}

  @ApiOperation({
    summary: 'Run allowlist',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
    isArray: true,
  })
  @ApiCreatedResponse({
    type: AllowlistRunResponseApiModel,
  })
  @Post()
  async create(
    @Param('allowlistId') allowlistId: string,
  ): Promise<AllowlistRunResponseApiModel> {
    return await this.allowlistRunsService.create(allowlistId);
  }

  @ApiOperation({
    summary: 'Get all allowlist runs',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
    isArray: true,
  })
  @Get()
  async getAll(
    @Param('allowlistId') allowlistId: string,
  ): Promise<AllowlistRunResponseApiModel[]> {
    return await this.allowlistRunsService.getAllForAllowlist(allowlistId);
  }

  @ApiOperation({
    summary: 'Get allowlist run',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
  })
  @Get(':runId')
  async get(
    @Param('allowlistId') allowlistId: string,
    @Param('runId') runId: string,
  ): Promise<AllowlistRunResponseApiModel> {
    return await this.allowlistRunsService.get(allowlistId, runId);
  }
}
