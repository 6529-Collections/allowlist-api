import { Controller, Get, Param } from '@nestjs/common';
import { TokenPoolService } from './token-pool.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { TokenPoolResponseApiModel } from './model/token-pool-response-api.model';
import { HaveAllowlistAccess } from '../../decorators/have-allowlist-access.decorator';

@HaveAllowlistAccess()
@Controller('/allowlists/:allowlistId/token-pools')
export class TokenPoolController {
  constructor(private readonly tokenPoolService: TokenPoolService) {}

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
    return this.tokenPoolService.getByAllowlistId(allowlistId);
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
    return this.tokenPoolService.getTokenPool({
      allowlistId,
      tokenPoolId,
    });
  }
}
