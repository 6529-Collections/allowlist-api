import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import { AllowlistDescriptionRequestApiModel } from './model/allowlist-description-request-api.model';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { AllowlistService } from './allowlist.service';
import { AllowlistDescriptionResponseApiModel } from './model/allowlist-description-response-api.model';
import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { PublicEndpoint } from '../auth/public-endpoint-decorator';

@Controller('/allowlists')
export class AllowlistController {
  constructor(private readonly allowlistService: AllowlistService) {}

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
    return await this.allowlistService.create(request);
  }

  @ApiOperation({
    summary: 'Get all allowlists',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
    isArray: true,
  })
  @Get()
  async getAll(
    @Request() req: { user?: { wallet?: string } },
  ): Promise<AllowlistDescriptionResponseApiModel[]> {
    console.log(req.user?.wallet);
    return await this.allowlistService.getAll();
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
    return await this.allowlistService.get(allowlistId);
  }

  @ApiOperation({
    summary: 'Delete allowlist',
  })
  @ApiOkResponse()
  @Delete(':allowlistId')
  async delete(@Param('allowlistId') allowlistId: string): Promise<void> {
    await this.allowlistService.delete(allowlistId);
  }

  @Post(':allowlistId/unique-wallets-count')
  async getUniqueWalletsCountFromOperations(
    @Body() operations: AllowlistOperation[],
  ): Promise<number> {
    return await this.allowlistService.getUniqueWalletsCountFromOperations(
      operations,
    );
  }
}
