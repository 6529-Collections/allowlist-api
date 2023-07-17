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
import { ReservoirCollection } from '../../reservoir-api/reservoir-api.types';

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

  private mapContractMetadata(
    contract: ReservoirCollection,
  ): SearchContractMetadataResponseApiModel {
    return {
      id: contract.id,
      address: contract.primaryContract,
      name: contract.name ?? contract.name ?? 'N/A',
      tokenType: contract.contractKind ?? 'N/A',
      floorPrice: contract.floorAsk?.price?.amount?.native ?? null,
      imageUrl: contract.image ?? null,
      description: contract.description ?? null,
      allTimeVolume: contract.volume?.allTime ?? null,
      openseaVerified: contract.openseaVerificationStatus === 'verified',
      tokenIds: null,
    };
  }

  async searchContractMetadata(
    kw: string,
  ): Promise<SearchContractMetadataResponseApiModel[]> {
    const reservoirContracts =
      await this.reservoirApiService.searchContractMetadata(kw);
    return (reservoirContracts?.collections ?? []).map(
      this.mapContractMetadata,
    );
  }

  async getLatestBlockNumber(): Promise<number> {
    return await this.alchemyApiService.getBlockNumber();
  }

  async getMemesCollections(): Promise<
    SearchContractMetadataResponseApiModel[]
  > {
    const results: SearchContractMetadataResponseApiModel[] = [];
    const defaultContracts: string[] = [
      '0x33fd426905f149f8376e227d0c9d3340aad17af1',
      '0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb',
      '0x0c58ef43ff3032005e472cb5709f8908acb00205',
      '0x07e24ee32163da59297b5341bef8f8a2eead271e',
    ];
    const defaultSubContracts: string[] = [
      '0x495f947276749ce646f68ac8c248420045cb7b5e:opensea-6529internjpg',
    ];

    const defaultContractsMetadata =
      await this.reservoirApiService.getContractsMetadataByAddresses(
        defaultContracts,
      );

    for (const contract of defaultContractsMetadata.collections ?? []) {
      results.push(this.mapContractMetadata(contract));
    }

    for (const subContractId of defaultSubContracts) {
      const [contractMetadata, tokenIds] = await Promise.all([
        await this.reservoirApiService.getContractMetadataById(subContractId),
        await this.reservoirApiService.getContractTokenIds(subContractId),
      ]);
      console.log(tokenIds);
      const subContractMetadata = contractMetadata.collections?.find(
        (collection) => collection.id === subContractId,
      );
      if (subContractMetadata) {
        results.push(this.mapContractMetadata(subContractMetadata));
      }
    }
    return results;
  }

  async getContractMetadata(
    contract: string,
  ): Promise<SearchContractMetadataResponseApiModel | null> {
    const results =
      await this.reservoirApiService.getContractsMetadataByAddress(contract);
    if (results.collections?.length) {
      return this.mapContractMetadata(results.collections.at(0));
    }
    return null;
  }
}
