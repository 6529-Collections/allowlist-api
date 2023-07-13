import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OtherService } from './other.service';
import { OperationDescriptionsResponseApiModel } from './model/operation-descriptions-response-api.model';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { SearchContractMetadataResponseApiModel } from './model/search-contract-metadata-response-api.model';
import { SearchContractMetadataRequestApiModel } from './model/search-contract-metadata-request-api.model';

@Controller('other')
export class OtherController {
  constructor(private readonly otherService: OtherService) {}

  @ApiOperation({
    summary: 'Get all operation descriptions',
  })
  @ApiOkResponse({
    type: OperationDescriptionsResponseApiModel,
    isArray: true,
  })
  @Get('operations')
  async getOperations(): Promise<OperationDescriptionsResponseApiModel[]> {
    return this.otherService.getOperationDescriptions();
  }

  @ApiOperation({
    summary: 'Get operation descriptions for a given operation type',
  })
  @ApiOkResponse({
    type: OperationDescriptionsResponseApiModel,
    isArray: true,
  })
  @Get('operations/types/:operationType')
  async getOperationsForType(
    @Param('operationType') operationType: string,
  ): Promise<OperationDescriptionsResponseApiModel[]> {
    return this.otherService.getOperationDescriptionsForType(operationType);
  }

  @ApiOperation({
    summary: 'Search contract metadata',
  })
  @ApiOkResponse({
    type: SearchContractMetadataResponseApiModel,
    isArray: true,
  })
  @Post('search-contract-metadata')
  async searchContractMetadata(
    @Body() { keyword }: SearchContractMetadataRequestApiModel,
  ): Promise<SearchContractMetadataResponseApiModel[]> {
    return await this.otherService.searchContractMetadata(keyword);
  }

  @ApiOperation({
    summary: 'Get latest block number',
  })
  @ApiOkResponse({
    type: Number,
  })
  @Get('latest-block-number')
  async getLatestBlockNumber(): Promise<number> {
    return await this.otherService.getLatestBlockNumber();
  }
}
