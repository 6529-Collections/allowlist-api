import {
  BadRequestException,
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
import { isEthereumAddress } from 'class-validator';
import { HaveAllowlistAccess } from '../../decorators/have-allowlist-access.decorator';

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
    @Request() req: { user?: { wallet?: string } },
  ): Promise<AllowlistDescriptionResponseApiModel> {
    if (!req.user?.wallet || !isEthereumAddress(req.user.wallet)) {
      throw new BadRequestException('Invalid wallet');
    }
    return await this.allowlistService.create({
      input: request,
      wallet: req.user.wallet,
    });
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
    if (!req.user?.wallet || !isEthereumAddress(req.user.wallet)) {
      throw new BadRequestException('Invalid wallet');
    }
    return await this.allowlistService.getAll({ wallet: req.user.wallet });
  }

  @ApiOperation({
    summary: 'Get allowlist description',
  })
  @ApiOkResponse({
    type: AllowlistDescriptionRequestApiModel,
    isArray: true,
  })
  @Get(':allowlistId')
  @HaveAllowlistAccess()
  async get(
    @Param('allowlistId') allowlistId: string,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    return await this.allowlistService.get(allowlistId);
  }

  @ApiOperation({
    summary: 'Delete allowlist',
  })
  @ApiOkResponse()
  @HaveAllowlistAccess()
  @Delete(':allowlistId')
  async delete(@Param('allowlistId') allowlistId: string): Promise<string> {
    await this.allowlistService.delete(allowlistId);
    return allowlistId;
  }

  @HaveAllowlistAccess()
  @Post(':allowlistId/unique-wallets-count')
  async getUniqueWalletsCountFromOperations(
    @Body() operations: AllowlistOperation[],
  ): Promise<number> {
    return await this.allowlistService.getUniqueWalletsCountFromOperations(
      operations,
    );
  }
}
