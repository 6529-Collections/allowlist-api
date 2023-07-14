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
import { ReservoirApiService } from '../../reservoir-api/reservoir-api.service';

@Injectable()
export class OtherService {
  constructor(
    private readonly alchemyApiService: AlchemyApiService,
    private readonly reservoirApiService: ReservoirApiService,
  ) {}

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
    const reservoirContracts =
      await this.reservoirApiService.searchContractMetadata(kw);
    return (
      reservoirContracts?.collections?.map((contract) => ({
        id: contract.id,
        address: contract.primaryContract,
        name: contract.name ?? contract.name ?? 'N/A',
        tokenType: contract.contractKind ?? 'N/A',
        floorPrice: contract.floorAsk?.price?.amount?.native ?? null,
        imageUrl: contract.image ?? null,
        description: contract.description ?? null,
      })) ?? []
    );
  }

  async getLatestBlockNumber(): Promise<number> {
    return await this.alchemyApiService.getBlockNumber();
  }
}
