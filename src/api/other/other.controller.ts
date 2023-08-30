import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OtherService } from './other.service';
import { OperationDescriptionsResponseApiModel } from './model/operation-descriptions-response-api.model';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { SearchContractMetadataResponseApiModel } from './model/search-contract-metadata-response-api.model';
import { SearchContractMetadataRequestApiModel } from './model/search-contract-metadata-request-api.model';
import { ContractTokenIdsAsStringResponseApiModel } from './model/contract-token-ids-as-string-response-api.model';
import { MemesSeasonResponseApiModel } from './model/memes-season-response-api.model';
import { ResolveEnsResponseApiModel } from './model/resolve-ens-response-api.model';
import { PublicEndpoint } from '../auth/public-endpoint-decorator';
import { PredictBlockNumberRequestApiModel } from './model/predict-block-number-request.api.model';
import { PredictBlockNumbersRequestApiModel } from './model/predict-block-numbers-request-api.model';
import { PredictBlockNumbersResponseApiModel } from './model/predict-block-numbers-response-api.model';

@PublicEndpoint()
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
    summary: 'Get contract metadata',
  })
  @ApiOkResponse({
    type: SearchContractMetadataResponseApiModel || null,
    isArray: false,
  })
  @Get('contract-metadata/:contract')
  async getContractMetadata(
    @Param('contract') contract: string,
  ): Promise<SearchContractMetadataResponseApiModel | null> {
    return await this.otherService.getContractMetadata(contract);
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

  @ApiOperation({
    summary: 'Predict the Ethereum block number for a given timestamp',
  })
  @ApiOkResponse({
    type: Number,
  })
  @Post('predict-block-number')
  async predictBlockNumber(
    @Body() { timestamp }: PredictBlockNumberRequestApiModel,
  ): Promise<number> {
    return await this.otherService.predictBlockNumber({ timestamp });
  }

  @ApiOperation({
    summary: 'Predict Ethereum block numbers for a given timestamp range',
  })
  @ApiOkResponse({
    type: PredictBlockNumbersResponseApiModel,
    isArray: true,
  })
  @Post('predict-block-numbers')
  async predictBlockNumbers(
    @Body()
    {
      minTimestamp,
      maxTimestamp,
      blockNumberIncludes,
    }: PredictBlockNumbersRequestApiModel,
  ): Promise<PredictBlockNumbersResponseApiModel[]> {
    return await this.otherService.predictBlockNumbers({
      minTimestamp,
      maxTimestamp,
      blockNumberIncludes,
    });
  }

  @ApiOperation({
    summary: 'Get memes ecosystem collections',
  })
  @ApiOkResponse({
    type: SearchContractMetadataResponseApiModel,
    isArray: true,
  })
  @Get('memes-collections')
  async getMemesCollections(): Promise<
    SearchContractMetadataResponseApiModel[]
  > {
    return await this.otherService.getMemesCollections();
  }

  @ApiOperation({
    summary: 'Get memes seasons',
  })
  @ApiOkResponse({
    type: MemesSeasonResponseApiModel,
    isArray: true,
  })
  @Get('memes-seasons')
  async getMemesSeasons(): Promise<MemesSeasonResponseApiModel[]> {
    return await this.otherService.getMemesSeasons();
  }

  @ApiOperation({
    summary: 'Get contract token ids as string',
  })
  @ApiOkResponse({
    type: ContractTokenIdsAsStringResponseApiModel,
    isArray: false,
  })
  @Get('contract-token-ids-as-string/:contractId')
  async getContractTokenIdsAsString(
    @Param('contractId') contractId: string,
  ): Promise<ContractTokenIdsAsStringResponseApiModel> {
    return await this.otherService.getContractTokenIdsAsString(contractId);
  }

  @ApiOperation({
    summary: 'Resolve ENS to address',
  })
  @ApiOkResponse({
    type: ResolveEnsResponseApiModel,
    isArray: true,
  })
  @Post('resolve-ens-to-address')
  async resolveEnsToAddress(@Body() ens: string[]) {
    return await this.otherService.resolveEnsToAddress(ens);
  }
}
