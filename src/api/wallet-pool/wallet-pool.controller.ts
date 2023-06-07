import { Controller, Get, Param } from '@nestjs/common';
import { WalletPoolService } from './wallet-pool.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { WalletPoolResponseApiModel } from './model/wallet-pool-response-api.model';

@Controller('/allowlists/:allowlistId/wallet-pools')
export class WalletPoolController {
  constructor(private readonly walletPoolService: WalletPoolService) {}

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
    return this.walletPoolService.getByAllowlistId(allowlistId);
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
    return this.walletPoolService.getWalletPool({
      allowlistId,
      walletPoolId,
    });
  }
}
