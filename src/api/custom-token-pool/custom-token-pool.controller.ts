import { Controller, Get, Param } from '@nestjs/common';
import { CustomTokenPoolService } from './custom-token-pool.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CustomTokenPoolResponseApiModel } from './model/custom-token-pool-response-api.model';

@Controller('/allowlists/:allowlistId/custom-token-pools')
export class CustomTokenPoolController {
  constructor(
    private readonly customTokenPoolService: CustomTokenPoolService,
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
    return this.customTokenPoolService.getByAllowlistId(allowlistId);
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
    return this.customTokenPoolService.getCustomTokenPool({
      allowlistId,
      customTokenPoolId,
    });
  }
}
