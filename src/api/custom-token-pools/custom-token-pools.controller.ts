import { Controller, Get, Param } from '@nestjs/common';
import { CustomTokenPoolsService } from './custom-token-pools.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CustomTokenPoolResponseApiModel } from './models/custom-token-pool-response-api.model';

@Controller('/allowlists/:allowlistId/custom-token-pools')
export class CustomTokenPoolsController {
  constructor(
    private readonly customTokenPoolsService: CustomTokenPoolsService,
  ) {}

  @ApiOperation({
    summary: 'Get all custom token pools for allowlist',
  })
  @ApiOkResponse({
    type: CustomTokenPoolResponseApiModel,
    isArray: true,
  })
  @Get()
  async getByAllowlistId(
    @Param('allowlistId') allowlistId: string,
  ): Promise<CustomTokenPoolResponseApiModel[]> {
    return this.customTokenPoolsService.getByAllowlistId(allowlistId);
  }

  @ApiOperation({
    summary: 'Get custom token pool',
  })
  @ApiOkResponse({
    type: CustomTokenPoolResponseApiModel,
  })
  @Get(':customTokenPoolId')
  async get(
    @Param('allowlistId') allowlistId: string,
    @Param('customTokenPoolId') customTokenPoolId: string,
  ): Promise<CustomTokenPoolResponseApiModel> {
    return this.customTokenPoolsService.getCustomTokenPool({
      allowlistId,
      customTokenPoolId,
    });
  }
}
