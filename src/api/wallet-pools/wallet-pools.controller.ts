import { Controller, Get, Param } from '@nestjs/common';
import { WalletPoolsService } from './wallet-pools.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { WalletPoolResponseApiModel } from './models/wallet-pool-response-api.model';

@Controller('/allowlists/:allowlistId/wallet-pools')
export class WalletPoolsController {
  constructor(private readonly walletPoolsService: WalletPoolsService) {}

  @ApiOperation({
    summary: 'Get all wallet pools for allowlist',
  })
  @ApiOkResponse({
    type: WalletPoolResponseApiModel,
    isArray: true,
  })
  @Get()
  async getByAllowlistId(
    @Param('allowlistId') allowlistId: string,
  ): Promise<WalletPoolResponseApiModel[]> {
    return this.walletPoolsService.getByAllowlistId(allowlistId);
  }

  @ApiOperation({
    summary: 'Get wallet pool',
  })
  @ApiOkResponse({
    type: WalletPoolResponseApiModel,
  })
  @Get(':walletPoolId')
  async get(
    @Param('allowlistId') allowlistId: string,
    @Param('walletPoolId') walletPoolId: string,
  ): Promise<WalletPoolResponseApiModel> {
    return this.walletPoolsService.getWalletPool({
      allowlistId,
      walletPoolId,
    });
  }
}
