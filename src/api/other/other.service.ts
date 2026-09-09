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
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
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
import { UpstreamProviderError } from '../../common/upstream-provider.error';

const MAX_TOKEN_ID_PAGES = 100;
const MAX_TOKEN_IDS = 100_000;

interface BlockPredictionContext {
  readonly now: number;
  readonly currentBlock: number;
  readonly blockTimeMillis: number;
}

@Injectable()
export class OtherService {
  private readonly logger = new Logger(OtherService.name);

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
    const now = Time.currentMillis();
    if (timestamp < now) {
      throw new NotFoundException('Timestamp must be in the future');
    }
    const context = await this.createBlockPredictionContext({ now });
    return this.predictBlockFromContext(timestamp, context);
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
    const context = await this.createBlockPredictionContext({ now });
    const minBlock = this.predictBlockFromContext(minTimestamp, context);
    const maxBlock = this.predictBlockFromContext(maxTimestamp, context);
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
    if (
      contractId ===
      '0x495f947276749ce646f68ac8c248420045cb7b5e:opensea-6529internjpg'
    ) {
      return {
        tokenIds:
          '114495225433585396360028190551351025332882118060143334094864210829510638043137,114495225433585396360028190551351025332882118060143334094864210830610149670913,114495225433585396360028190551351025332882118060143334094864210831709661298689,114495225433585396360028190551351025332882118060143334094864210832809172926465,114495225433585396360028190551351025332882118060143334094864210833908684554241,114495225433585396360028190551351025332882118060143334094864210835008196182017,114495225433585396360028190551351025332882118060143334094864210836107707809793,114495225433585396360028190551351025332882118060143334094864210837207219437569,114495225433585396360028190551351025332882118060143334094864210838306731065345,114495225433585396360028190551351025332882118060143334094864210839406242693121,114495225433585396360028190551351025332882118060143334094864210840505754320897,114495225433585396360028190551351025332882118060143334094864210841605265948673,114495225433585396360028190551351025332882118060143334094864210842704777576449,114495225433585396360028190551351025332882118060143334094864210843804289204225,114495225433585396360028190551351025332882118060143334094864210844903800832001,114495225433585396360028190551351025332882118060143334094864210846003312459777,114495225433585396360028190551351025332882118060143334094864210847102824087553,114495225433585396360028190551351025332882118060143334094864210848202335715329,114495225433585396360028190551351025332882118060143334094864210849301847343105,114495225433585396360028190551351025332882118060143334094864210850401358970881',
      };
    }
    let tokenIds: string[];
    try {
      tokenIds = await this.collectTokenIds((continuation) =>
        this.transposeApiService.getContractTokenIds({
          address: contractId,
          continuation,
        }),
      );
    } catch (transposeError) {
      if (transposeError instanceof BadRequestException) {
        throw transposeError;
      }
      this.logProviderFallback('Transpose', transposeError);
      try {
        tokenIds = await this.collectTokenIds((continuation) =>
          this.alchemyApiService.getContractTokenIds({
            address: contractId,
            continuation,
          }),
        );
      } catch (alchemyError) {
        this.logProviderFallback('Alchemy', alchemyError);
        throw this.mapProviderErrors(
          [transposeError, alchemyError],
          'Token ID providers',
        );
      }
    }

    return {
      tokenIds: tokenIds.length ? formatNumberRange(tokenIds) : '',
    };
  }

  private async createBlockPredictionContext({
    now,
  }: {
    now: number;
  }): Promise<BlockPredictionContext> {
    let currentBlock: number;
    try {
      currentBlock = await this.alchemyApiService.getBlockNumber();
    } catch (error) {
      this.logProviderFallback('Alchemy', error);
      throw this.mapProviderError(error, 'Alchemy');
    }

    let blockTimeMillis: number;
    try {
      blockTimeMillis = await this.etherscanApiService.getBlockTimeMillis({
        currentBlock,
      });
    } catch (error) {
      this.logProviderFallback('Etherscan', error);
      throw this.mapProviderError(error, 'Etherscan');
    }

    return { now, currentBlock, blockTimeMillis };
  }

  private predictBlockFromContext(
    timestamp: number,
    context: BlockPredictionContext,
  ): number {
    const predictedBlocks = Math.ceil(
      (timestamp - context.now) / context.blockTimeMillis,
    );
    return context.currentBlock + predictedBlocks;
  }

  private async collectTokenIds(
    getPage: (continuation: string | null) => Promise<{
      tokens: string[];
      continuation: string | null;
    }>,
  ): Promise<string[]> {
    const tokenIds: string[] = [];
    const seenContinuations = new Set<string>();
    let continuation: string | null = null;

    for (let page = 0; page < MAX_TOKEN_ID_PAGES; page++) {
      const response = await getPage(continuation);
      tokenIds.push(...response.tokens);
      if (tokenIds.length > MAX_TOKEN_IDS) {
        throw new UpstreamProviderError(
          'Token ID pagination',
          'invalid-response',
          undefined,
          undefined,
          `Exceeded ${MAX_TOKEN_IDS} token IDs`,
        );
      }

      continuation = response.continuation;
      if (!continuation) {
        return tokenIds;
      }
      if (seenContinuations.has(continuation)) {
        throw new UpstreamProviderError(
          'Token ID pagination',
          'invalid-response',
          undefined,
          undefined,
          'Provider repeated a pagination token',
        );
      }
      seenContinuations.add(continuation);
    }

    throw new UpstreamProviderError(
      'Token ID pagination',
      'invalid-response',
      undefined,
      undefined,
      `Exceeded ${MAX_TOKEN_ID_PAGES} pages`,
    );
  }

  private mapProviderError(error: unknown, provider: string) {
    if (error instanceof UpstreamProviderError && !error.isTemporary) {
      return new BadGatewayException(
        `${provider} returned an invalid response`,
      );
    }
    return new ServiceUnavailableException(
      `${provider} is temporarily unavailable`,
    );
  }

  private mapProviderErrors(errors: unknown[], provider: string) {
    const typedErrors = errors.filter(
      (error): error is UpstreamProviderError =>
        error instanceof UpstreamProviderError,
    );
    if (
      typedErrors.length === errors.length &&
      typedErrors.every((error) => error.isTemporary)
    ) {
      return new ServiceUnavailableException(
        `${provider} are temporarily unavailable`,
      );
    }
    return new BadGatewayException(`${provider} returned an invalid response`);
  }

  private logProviderFallback(provider: string, error: unknown): void {
    if (error instanceof UpstreamProviderError) {
      this.logger.warn(
        `[UPSTREAM_PROVIDER_FALLBACK] provider=${provider} kind=${
          error.kind
        } status=${error.upstreamStatus ?? 'none'} requestId=${
          error.requestId ?? 'none'
        } message=${error.providerMessage ?? 'none'}`,
      );
      return;
    }
    this.logger.warn(
      `[UPSTREAM_PROVIDER_FALLBACK] provider=${provider} kind=unknown status=none requestId=none`,
    );
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
