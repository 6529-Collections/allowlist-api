import {
  AllowlistOperationCode,
  AllowlistOperationType,
} from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import {
  ALLOWLIST_CODE_DESCRIPTIONS,
  getCodesForType,
} from '@6529-collections/allowlist-lib/utils/allowlist-operation-code.utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import { OperationDescriptionsResponseApiModel } from './model/operation-descriptions-response-api.model';
import { AlchemyApiService } from '../../alchemy-api/alchemy-api.module.service';
import { SearchContractMetadataResponseApiModel } from './model/search-contract-metadata-response-api.model';

@Injectable()
export class OtherService {
  constructor(private readonly alchemyApiService: AlchemyApiService) {}

  getOperationDescriptions(): OperationDescriptionsResponseApiModel[] {
    return Object.keys(AllowlistOperationCode).map(
      (code: AllowlistOperationCode) => ({
        code,
        title: ALLOWLIST_CODE_DESCRIPTIONS[code].title,
        description: ALLOWLIST_CODE_DESCRIPTIONS[code].description,
      }),
    );
  }

  getOperationDescriptionsForType(
    operationType: string,
  ): OperationDescriptionsResponseApiModel[] {
    const operationTypeUpper = operationType.toUpperCase();
    if (!Object.keys(AllowlistOperationType).includes(operationTypeUpper)) {
      throw new BadRequestException(`Invalid operation type: ${operationType}`);
    }
    const operationCodes = getCodesForType(
      operationTypeUpper as AllowlistOperationType,
    );
    return operationCodes.map((code) => ({
      code,
      title: ALLOWLIST_CODE_DESCRIPTIONS[code].title,
      description: ALLOWLIST_CODE_DESCRIPTIONS[code].description,
    }));
  }

  async searchContractMetadata(
    kw: string,
  ): Promise<SearchContractMetadataResponseApiModel[]> {
    const contracts = await this.alchemyApiService.searchContractMetadata(kw);
    return contracts.map((contract) => ({
      address: contract.address,
      name: contract.name ?? contract.openSea?.collectionName ?? 'N/A',
      tokenType: contract.tokenType ?? 'N/A',
      floorPrice: contract.openSea?.floorPrice ?? null,
      imageUrl: contract.openSea?.imageUrl ?? null,
      description: contract.openSea?.description ?? null,
    }));
  }

  async getLatestBlockNumber(): Promise<number> {
    return await this.alchemyApiService.getBlockNumber();
  }
}
