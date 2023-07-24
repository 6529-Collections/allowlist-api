import { Controller, Get, Param, Query } from '@nestjs/common';
import { TokenPoolDownloadService } from './token-pool-download.service';
import { TokenPoolDownloadResponseApiModel } from './model/token-pool-download-response-api.model';
import { ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';

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
  @ApiQuery({
    name: 'exclude-component-winners',
    description:
      'Exclude component winners, comma separated string of component ids.',
    example:
      '5f1a526f3e8a7c4d7f53b8ac,5f1a527e2f907c2d8e10a2be,5f1a52943e8a5c4d8f45f3ba',
    required: false,
  })
  @Get(':tokenPoolId/unique-wallets-count')
  async getUniqueWalletsCount(
    @Param('allowlistId') allowlistId: string,
    @Param('tokenPoolId') tokenPoolId: string,
    @Query('exclude-component-winners')
    componentIds?: string,
  ): Promise<number> {
    return await this.tokenPoolDownloadService.getUniqueWalletsCount({
      allowlistId,
      tokenPoolId,
      excludeComponentIds:
        componentIds?.split(',').map((item) => item.trim()) ?? [],
    });
  }
}
