import { Controller, Get, Param } from '@nestjs/common';
import { TokenPoolsService } from './token-pools.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { TokenPoolResponseApiModel } from './models/token-pool-response-api.model';

@Controller('/allowlists/:allowlistId/token-pools')
export class TokenPoolsController {
  constructor(private readonly tokenPoolsService: TokenPoolsService) {}

  @ApiOperation({
    summary: 'Get all token pools for allowlist',
  })
  @ApiOkResponse({
    type: TokenPoolResponseApiModel,
    isArray: true,
  })
  @Get()
  async getByAllowlistId(
    @Param('allowlistId') allowlistId: string,
  ): Promise<TokenPoolResponseApiModel[]> {
    return this.tokenPoolsService.getByAllowlistId(allowlistId);
  }

  @ApiOperation({
    summary: 'Get token pool',
  })
  @ApiOkResponse({
    type: TokenPoolResponseApiModel,
  })
  @Get(':tokenPoolId')
  async get(
    @Param('allowlistId') allowlistId: string,
    @Param('tokenPoolId') tokenPoolId: string,
  ): Promise<TokenPoolResponseApiModel> {
    return this.tokenPoolsService.getTokenPool({
      allowlistId,
      tokenPoolId,
    });
  }
}
