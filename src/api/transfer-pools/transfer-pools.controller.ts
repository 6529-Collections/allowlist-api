import { Controller, Get, Param } from '@nestjs/common';
import { TransferPoolsService } from './transfer-pools.service';
import { TransferPoolResponseApiModel } from './models/transfer-pool-response-api.model';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('/allowlists/:allowlistId/transfer-pools')
export class TransferPoolsController {
  constructor(private readonly transferPoolsService: TransferPoolsService) {}

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
    return this.transferPoolsService.getByAllowlistId(allowlistId);
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
    return this.transferPoolsService.getTransferPool({
      allowlistId,
      transferPoolId
    });
  }
}
