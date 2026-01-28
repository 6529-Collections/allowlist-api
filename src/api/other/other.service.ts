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
import {
  AlchemyApiService,
  ContractMetadataResponse,
} from '../../alchemy-api/alchemy-api.service';
import { SearchContractMetadataResponseApiModel } from './model/search-contract-metadata-response-api.model';
import { formatNumberRange } from '../../app.utils';
import { ContractTokenIdsAsStringResponseApiModel } from './model/contract-token-ids-as-string-response-api.model';
import { MemesSeasonResponseApiModel } from './model/memes-season-response-api.model';
import { SeizeApiService } from '../../seize-api/seize-api.service';
import { ResolveEnsResponseApiModel } from './model/resolve-ens-response-api.model';
import { EtherscanApiService } from '../../etherscan-api/etherscan-api.service';
import { Time } from '../../time';
import { PredictBlockNumbersResponseApiModel } from './model/predict-block-numbers-response-api.model';
import { countSubNumbersInRange } from './other.utils';
import { TransposeApiService } from '../../transpose-api/transpose-api.service';

@Injectable()
export class OtherService {
  constructor(
    private readonly alchemyApiService: AlchemyApiService,
    private readonly transposeApiService: TransposeApiService,
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
    contract: ContractMetadataResponse,
  ): SearchContractMetadataResponseApiModel {
    return {
      id: contract.id,
      address: contract.address,
      name: contract.name ?? contract.name ?? 'N/A',
      tokenType: contract.tokenType ?? 'N/A',
      floorPrice: null,
      imageUrl: contract.imageUrl ?? null,
      description: contract.description ?? null,
      allTimeVolume: null,
      openseaVerified: contract.openseaVerified,
    };
  }

  async searchContractMetadata(
    kw: string,
  ): Promise<SearchContractMetadataResponseApiModel[]> {
    const contracts = await this.alchemyApiService.searchContractMetadata(kw);
    return (contracts ?? []).map(this.mapContractMetadata);
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

    const defaultContractsMetadata = await Promise.all(
      defaultContracts.map((contract) =>
        this.alchemyApiService.getContractMetadata(contract),
      ),
    );

    for (const contract of defaultContractsMetadata ?? []) {
      if (contract) {
        results.push(this.mapContractMetadata(contract));
      }
    }
    results.push({
      id: '0x495f947276749ce646f68ac8c248420045cb7b5e:opensea-6529internjpg',
      address: '0x495f947276749ce646f68ac8c248420045cb7b5e',
      name: '6529 Intern JPGs',
      tokenType: 'erc1155',
      floorPrice: null,
      imageUrl:
        'https://i2.seadn.io/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/b7b5b774da194235d7a5baf0fed900c8.png?h=250&w=250',
      description: '',
      allTimeVolume: 0,
      openseaVerified: false,
    });

    return results;
  }

  async getContractMetadata(
    contract: string,
  ): Promise<SearchContractMetadataResponseApiModel | null> {
    const result = await this.alchemyApiService.getContractMetadata(contract);
    if (result) {
      return this.mapContractMetadata(result);
    }
    return null;
  }

  async getContractTokenIdsAsString(
    contractId: string,
  ): Promise<ContractTokenIdsAsStringResponseApiModel> {
    const tokenIds: string[] = [];
    let continuation: string | null = null;
    if (
      contractId ===
      '0x495f947276749ce646f68ac8c248420045cb7b5e:opensea-6529internjpg'
    ) {
      return {
        tokenIds:
          '114495225433585396360028190551351025332882118060143334094864210829510638043137,114495225433585396360028190551351025332882118060143334094864210830610149670913,114495225433585396360028190551351025332882118060143334094864210831709661298689,114495225433585396360028190551351025332882118060143334094864210832809172926465,114495225433585396360028190551351025332882118060143334094864210833908684554241,114495225433585396360028190551351025332882118060143334094864210835008196182017,114495225433585396360028190551351025332882118060143334094864210836107707809793,114495225433585396360028190551351025332882118060143334094864210837207219437569,114495225433585396360028190551351025332882118060143334094864210838306731065345,114495225433585396360028190551351025332882118060143334094864210839406242693121,114495225433585396360028190551351025332882118060143334094864210840505754320897,114495225433585396360028190551351025332882118060143334094864210841605265948673,114495225433585396360028190551351025332882118060143334094864210842704777576449,114495225433585396360028190551351025332882118060143334094864210843804289204225,114495225433585396360028190551351025332882118060143334094864210844903800832001,114495225433585396360028190551351025332882118060143334094864210846003312459777,114495225433585396360028190551351025332882118060143334094864210847102824087553,114495225433585396360028190551351025332882118060143334094864210848202335715329,114495225433585396360028190551351025332882118060143334094864210849301847343105,114495225433585396360028190551351025332882118060143334094864210850401358970881',
      };
    }
    do {
      const response = await this.transposeApiService.getContractTokenIds({
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
    return seasons.map((season) => {
      const tokens = Array.from(
        { length: season.end_index - season.start_index + 1 },
        (_, i) => season.start_index + i,
      );
      return {
        season: Number.parseInt(season.name.replace('Season ', '')),
        tokenIds: formatNumberRange(tokens),
      };
    });
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
