import {
  AllowlistOperationCode,
  AllowlistOperationType,
} from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import {
  ALLOWLIST_CODE_DESCRIPTIONS,
  getCodesForType,
} from '@6529-collections/allowlist-lib/utils/allowlist-operation-code.utils';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OperationDescriptionsResponseApiModel } from './model/operation-descriptions-response-api.model';
import { AlchemyApiService } from '../../alchemy-api/alchemy-api.service';
import { SearchContractMetadataResponseApiModel } from './model/search-contract-metadata-response-api.model';
import { ReservoirApiService } from '../../reservoir-api/reservoir-api.service';
import { ReservoirCollection } from '../../reservoir-api/reservoir-api.types';
import { formatNumberRange } from '../../app.utils';
import { ContractTokenIdsAsStringResponseApiModel } from './model/contract-token-ids-as-string-response-api.model';
import { MemesSeasonResponseApiModel } from './model/memes-season-response-api.model';
import { SeizeApiService } from '../../seize-api/seize-api.service';
import { ResolveEnsResponseApiModel } from './model/resolve-ens-response-api.model';
import { EtherscanApiService } from '../../etherscan-api/etherscan-api.service';
import { Time } from '../../time';
import { PredictBlockNumbersResponseApiModel } from './model/predict-block-numbers-response-api.model';
import { countSubNumbersInRange } from './other.utils';

@Injectable()
export class OtherService {
  constructor(
    private readonly alchemyApiService: AlchemyApiService,
    private readonly reservoirApiService: ReservoirApiService,
    private readonly seizeApiService: SeizeApiService,
    private readonly etherscanApiService: EtherscanApiService,
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

  async predictBlockNumber({
    timestamp,
  }: {
    timestamp: number;
  }): Promise<number> {
    // Get current timestamp
    const now = Time.currentMillis();
    if (timestamp < now) {
      throw new NotFoundException('Timestamp must be in the future');
    }
    // Get current block number
    const currentBlock = await this.etherscanApiService.currentBlockNumber();
    // Calculate the difference between the current timestamp and the given timestamp
    const timeDiff = timestamp - now;
    // Calculate the number of blocks that will be mined in the given time
    const predictedBlocks = Math.ceil(timeDiff / 12000);
    // Get predicted block number with naive approach (12sec per block)
    const predictedBlockNaive = currentBlock + predictedBlocks;
    // Get predicted block data from Etherscan API
    const { result } = await this.etherscanApiService.getBlockCountdown({
      blockNumber: predictedBlockNaive,
    });
    if (!result) {
      throw new NotFoundException('Something went wrong');
    }
    const { RemainingBlock, EstimateTimeInSec } = result;
    if (!RemainingBlock) {
      throw new NotFoundException('Something went wrong');
    }

    if (!EstimateTimeInSec) {
      throw new NotFoundException('Something went wrong');
    }

    // How many blocks will be mined in the given time
    const blockCounts = parseInt(RemainingBlock, 10);
    // How much time will be passed in the given time
    const estimateTimeInMillis = parseInt(EstimateTimeInSec, 10) * 1000;
    // Calculate the average block time
    const blockTime = estimateTimeInMillis / blockCounts;
    // Calculate the number of blocks that will be mined in the given time
    const blocks = Math.ceil(timeDiff / blockTime);
    // Return the predicted block number
    return currentBlock + blocks;
  }

  async predictBlockNumbers({
    minTimestamp,
    maxTimestamp,
    blockNumberIncludes,
  }: {
    minTimestamp: number;
    maxTimestamp: number;
    blockNumberIncludes: number[];
  }): Promise<PredictBlockNumbersResponseApiModel[]> {
    const now = Time.currentMillis();
    if (minTimestamp < now) {
      throw new NotFoundException('Min timestamp must be in the future');
    }
    if (maxTimestamp < now) {
      throw new NotFoundException('Max timestamp must be in the future');
    }
    if (minTimestamp > maxTimestamp) {
      throw new NotFoundException(
        'Min timestamp must be less than max timestamp',
      );
    }
    const minBlock = await this.predictBlockNumber({ timestamp: minTimestamp });
    const maxBlock = await this.predictBlockNumber({ timestamp: maxTimestamp });
    return countSubNumbersInRange({
      start: minBlock,
      end: maxBlock,
      subnumbers: blockNumberIncludes,
    });
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
      const contractMetadata =
        await this.reservoirApiService.getContractMetadataById(subContractId);
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

  async getContractTokenIdsAsString(
    contractId: string,
  ): Promise<ContractTokenIdsAsStringResponseApiModel> {
    const tokenIds: string[] = [];
    let continuation: string | null = null;

    do {
      const response = await this.reservoirApiService.getContractTokenIds({
        address: contractId,
        continuation,
      });
      tokenIds.push(...response.tokens);
      continuation = response.continuation;
    } while (continuation);

    return {
      tokenIds: tokenIds.length ? formatNumberRange(tokenIds) : '',
    };
  }

  async getMemesSeasons(): Promise<MemesSeasonResponseApiModel[]> {
    const seasons = await this.seizeApiService.getMemesSeasons();
    return seasons.map((season) => ({
      season: season.season,
      tokenIds: formatNumberRange(season.token_ids.split(',')),
    }));
  }

  async resolveEnsToAddress(
    ens: string[],
  ): Promise<ResolveEnsResponseApiModel[]> {
    const results: ResolveEnsResponseApiModel[] = [];
    for (const ensName of ens) {
      const address = await this.alchemyApiService.resolveEnsToAddress(ensName);
      results.push({
        ens: ensName,
        address,
      });
    }
    return results;
  }
}
