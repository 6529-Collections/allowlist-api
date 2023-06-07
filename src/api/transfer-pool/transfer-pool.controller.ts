import { Controller, Get, Param } from '@nestjs/common';
import { TransferPoolService } from './transfer-pool.service';
import { TransferPoolResponseApiModel } from './model/transfer-pool-response-api.model';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('/allowlists/:allowlistId/transfer-pools')
export class TransferPoolController {
  constructor(private readonly transferPoolService: TransferPoolService) {}

  @ApiOperation({
    summary: 'Get all transfer pools for allowlist',
  })
  @ApiOkResponse({
    type: TransferPoolResponseApiModel,
    isArray: true,
  })
  @Get()
  async getByAllowlistId(
    @Param('allowlistId') allowlistId: string,
  ): Promise<TransferPoolResponseApiModel[]> {
    return this.transferPoolService.getByAllowlistId(allowlistId);
  }

  @ApiOperation({
    summary: 'Get transfer pool',
  })
  @ApiOkResponse({
    type: TransferPoolResponseApiModel,
  })
  @Get(':transferPoolId')
  async get(
    @Param('allowlistId') allowlistId: string,
    @Param('transferPoolId') transferPoolId: string,
  ): Promise<TransferPoolResponseApiModel> {
    return this.transferPoolService.getTransferPool({
      allowlistId,
      transferPoolId,
    });
  }
}
