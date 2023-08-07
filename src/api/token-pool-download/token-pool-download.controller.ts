import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TokenPoolDownloadService } from './token-pool-download.service';
import { TokenPoolDownloadResponseApiModel } from './model/token-pool-download-response-api.model';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { TokenPoolDownloadTokenPoolUniqueWalletsCountRequestApiModel } from './model/token-pool-download-token-pool-unique-wallets-count-request-api.model';
import { TokenPoolDownloadTokenResponseApiModel } from './model/token-pool-download-token-response-api.model';

@Controller('/allowlists/:allowlistId/token-pool-downloads')
export class TokenPoolDownloadController {
  constructor(
    private readonly tokenPoolDownloadService: TokenPoolDownloadService,
  ) {}

  @ApiOperation({
    summary: 'Get all token pool downloads for allowlist',
  })
  @ApiOkResponse({
    type: TokenPoolDownloadResponseApiModel,
    isArray: true,
  })
  @Get()
  async getByAllowlistId(
    @Param('allowlistId') allowlistId: string,
  ): Promise<TokenPoolDownloadResponseApiModel[]> {
    return this.tokenPoolDownloadService.getByAllowlistId(allowlistId);
  }

  @ApiOperation({
    summary: 'Get token pool download unique wallets count',
  })
  @ApiOkResponse({
    type: Number,
  })
  @Post('token-pool/:tokenPoolId/unique-wallets-count')
  async getTokenPoolUniqueWalletsCount(
    @Param('allowlistId') allowlistId: string,
    @Param('tokenPoolId') tokenPoolId: string,
    @Body()
    request: TokenPoolDownloadTokenPoolUniqueWalletsCountRequestApiModel,
  ): Promise<number> {
    return await this.tokenPoolDownloadService.getTokenPoolUniqueWalletsCount({
      tokenPoolId,
      params: request,
    });
  }

  @ApiOperation({
    summary: 'Get token pool tokens',
  })
  @ApiOkResponse({
    type: TokenPoolDownloadTokenResponseApiModel,
    isArray: true,
  })
  @Get('token-pool/:tokenPoolId/tokens')
  async getTokenPoolTokens(
    @Param('allowlistId') allowlistId: string,
    @Param('tokenPoolId') tokenPoolId: string,
  ): Promise<TokenPoolDownloadTokenResponseApiModel[]> {
    return await this.tokenPoolDownloadService.getTokenPoolTokens({
      tokenPoolId,
    });
  }
}
