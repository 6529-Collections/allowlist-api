import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AllowlistRepository } from '../../repository/allowlist/allowlist.repository';
import { AllowlistDescriptionRequestApiModel } from './model/allowlist-description-request-api.model';

import { Time } from '../../time';
import { AllowlistDescriptionResponseApiModel } from './model/allowlist-description-response-api.model';
import { bigInt2Number } from '../../app.utils';
import { CommonService } from '../../common/common.service';
import { AllowlistEntity } from '../../repository/allowlist/allowlist.entity';
import { AllowlistRunStatus } from './model/allowlist-run-status';
import { DB } from '../../repository/db';
import { RunnerProxy } from '../../runner/runner.proxy';
import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { AllowlistComponent } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-component';
import { TokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/token-pool';
import { Pool } from '@6529-collections/allowlist-lib/app-types';
import { randomUUID } from 'crypto';
import { PhaseComponentWinnerRepository } from '../../repository/phase-component-winner/phase-component-winner.repository';
import { TokenPoolTokenRepository } from '../../repository/token-pool-token/token-pool-token.repository';
import { AllowlistUserRepository } from '../../repository/allowlist-user/allowlist-user.repository';
import { SeizeApiService } from '../../seize-api/seize-api.service';

@Injectable()
export class AllowlistService {
  constructor(
    private readonly allowlistRepository: AllowlistRepository,
    private readonly componentWinners: PhaseComponentWinnerRepository,
    private readonly tokenPoolTokenRepository: TokenPoolTokenRepository,
    private readonly commonService: CommonService,
    private readonly runnerProxy: RunnerProxy,
    private readonly db: DB,
    private allowlistCreator: AllowlistCreator,
    private readonly allowlistUserRepository: AllowlistUserRepository,
    private readonly seizeApiService: SeizeApiService,
  ) {}

  private readonly logger = new Logger(AllowlistService.name);

  private allowlistEntityToResponseModel(
    entity: AllowlistEntity,
  ): AllowlistDescriptionResponseApiModel {
    const runStatus = entity.run_status;
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: bigInt2Number(entity.created_at),
      activeRun: runStatus
        ? {
            createdAt: bigInt2Number(entity.run_created_at),
            updatedAt: bigInt2Number(entity.run_updated_at),
            status: entity.run_status,
            errorReason: entity.error_reason,
          }
        : undefined,
    };
  }

  async getAll({
    wallet,
  }: {
    wallet: string;
  }): Promise<AllowlistDescriptionResponseApiModel[]> {
    const allowlistIds =
      await this.allowlistUserRepository.getAllowlistIdsForWallet({ wallet });
    if (!allowlistIds.length) {
      return [];
    }
    const entities = await this.allowlistRepository.findByIds({
      ids: allowlistIds,
    });
    return entities.map(this.allowlistEntityToResponseModel);
  }

  async canWalletCreateAllowlist({
    wallets,
    tdh,
  }: {
    wallets: string[];
    tdh: number;
  }): Promise<boolean> {
    if (tdh > +process.env.ALLOWLIST_MIN_TDH_REQUIRED_FOR_UNLIMITED_ALLOWLIST) {
      return true;
    }
    const minCreatedAt = BigInt(
      Time.currentMillis() -
        +process.env.ALLOWLIST_TIME_WINDOW_MS_ALLOWLIST_CREATION,
    );

    const createdCount =
      await this.allowlistUserRepository.createdAllowlistsCountAfterTime({
        wallets,
        createdAt: minCreatedAt,
      });

    if (
      createdCount >=
      +process.env.ALLOWLIST_LIMIT_BELOW_REQUESTED_TDH_IN_TIME_WINDOW
    ) {
      return false;
    }

    return true;
  }

  private async getWalletConsolidationsAndTdh(
    wallet: string,
  ): Promise<{ wallets: string[]; tdh: number }> {
    const consolidationsResponse =
      await this.seizeApiService.getWalletConsolidatedMetrics(wallet);
    if (!consolidationsResponse?.data?.at(0)?.wallets?.length) {
      return { wallets: [wallet], tdh: 0 };
    }
    return {
      wallets: consolidationsResponse.data
        .at(0)
        .wallets.map((wallet) => wallet.toLowerCase()),
      tdh: consolidationsResponse.data.at(0).boosted_memes_tdh ?? 0,
    };
  }

  async create({
    input,
    wallet,
  }: {
    input: AllowlistDescriptionRequestApiModel;
    wallet: string;
  }): Promise<AllowlistDescriptionResponseApiModel> {
    const { wallets, tdh } = await this.getWalletConsolidationsAndTdh(wallet);
    if (!(await this.canWalletCreateAllowlist({ wallets, tdh }))) {
      throw new BadRequestException(
        'You have reached your allowlists creation limit',
      );
    }
    const connection = await this.db.getConnection();
    try {
      const createdAt = BigInt(Time.currentMillis());
      await connection.beginTransaction();
      const entity = await this.allowlistRepository.save({
        request: {
          ...input,
          created_at: createdAt,
        },
        options: { connection },
      });
      await this.allowlistUserRepository.save({
        entity: {
          allowlist_id: entity.id,
          user_wallet: wallet,
          created_at: createdAt,
        },
        options: { connection },
      });
      await connection.commit();
      return this.allowlistEntityToResponseModel(entity);
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      await connection.end();
    }
  }

  async get(
    allowlistId: string,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    const entity = await this.allowlistRepository.findById(allowlistId);
    if (!entity) {
      throw new NotFoundException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }
    return this.allowlistEntityToResponseModel(entity);
  }

  async delete(allowlistId: string): Promise<void> {
    const entity = await this.allowlistRepository.findById(allowlistId);
    if (!entity) {
      throw new NotFoundException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }

    if (entity.run_status === 'PENDING' || entity.run_status === 'CLAIMED') {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} has running runs`,
      );
    }

    await this.commonService.deleteAllowlist(allowlistId);
  }

  private async prepNewRun({ allowlistId }: { allowlistId: string }) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      await this.allowlistRepository.detachRun({ allowlistId }, { connection });
      await this.allowlistRepository.attachRun(
        {
          allowlistId,
          status: AllowlistRunStatus.PENDING,
        },
        { connection },
      );
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      await connection.end();
    }
  }

  async planRun(allowlistId: string) {
    const allowlistEntity = await this.allowlistRepository.findById(
      allowlistId,
    );
    if (!allowlistEntity) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }
    if (
      allowlistEntity.run_status &&
      [AllowlistRunStatus.PENDING, AllowlistRunStatus.CLAIMED].includes(
        allowlistEntity.run_status as AllowlistRunStatus,
      )
    ) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} has an active run`,
      );
    }
    await this.prepNewRun({ allowlistId });
    this.logger.log(`Starting run for allowlist ${allowlistId}`);
    await this.runnerProxy.start(allowlistId);
    return this.get(allowlistId);
  }

  async getUniqueWalletsCountFromOperations(
    operations: AllowlistOperation[],
  ): Promise<number> {
    if (!operations.length) {
      throw new BadRequestException('Operations are empty');
    }

    const { createTokenPoolOps, allowlistOperations } = operations.reduce<{
      createTokenPoolOps: AllowlistOperation[];
      allowlistOperations: AllowlistOperation[];
    }>(
      (acc, o) => {
        if (o.code === AllowlistOperationCode.CREATE_TOKEN_POOL) {
          acc.createTokenPoolOps.push(o);
        } else {
          acc.allowlistOperations.push(o);
        }
        return acc;
      },
      { createTokenPoolOps: [], allowlistOperations: [] },
    );

    const createTokenPoolOpsMap = new Map<string, AllowlistOperation>(
      createTokenPoolOps.map((o) => [o.params.id, o]),
    );
    try {
      const allowlist = this.allowlistCreator.createAllowlistState();
      this.allowlistCreator.executeOperation({
        code: AllowlistOperationCode.CREATE_ALLOWLIST,
        params: {
          id: randomUUID(),
          name: 'test',
          description: 'test',
        },
        state: allowlist,
      });

      const testPhaseId = randomUUID();

      this.allowlistCreator.executeOperation({
        code: AllowlistOperationCode.ADD_PHASE,
        params: {
          id: testPhaseId,
          name: 'test',
          description: 'test',
        },
        state: allowlist,
      });

      const phaseIds: Set<string> = new Set<string>(
        allowlistOperations
          .filter((o) => o.code === AllowlistOperationCode.ADD_COMPONENT)
          .map((o) => o.params.phaseId),
      );

      for (const phaseId of phaseIds) {
        this.allowlistCreator.executeOperation({
          code: AllowlistOperationCode.ADD_PHASE,
          params: {
            id: phaseId,
            name: 'test',
            description: 'test',
          },
          state: allowlist,
        });
      }

      const addItemTokenPoolIds = new Set<string>(
        allowlistOperations
          .filter(
            (o) =>
              o.code === AllowlistOperationCode.ADD_ITEM &&
              o.params.poolType === Pool.TOKEN_POOL,
          )
          .map((o) => o.params.poolId),
      );

      const excludeTokenPoolIds = new Set(
        allowlistOperations.flatMap((o) => {
          if (
            o.code ===
            AllowlistOperationCode.ITEM_REMOVE_WALLETS_FROM_CERTAIN_TOKEN_POOLS
          ) {
            return o.params.pools
              .filter((p: any) => p.poolType === Pool.TOKEN_POOL)
              .map((p: any) => p.poolId);
          }
          return [];
        }),
      );

      const tokenPoolIds = new Set<string>(
        Array.from([...addItemTokenPoolIds, ...excludeTokenPoolIds]),
      );

      const componentWinnersComponentIds = new Set<string>(
        allowlistOperations
          .filter(
            (o) =>
              o.code ===
              AllowlistOperationCode.ITEM_REMOVE_WALLETS_FROM_CERTAIN_COMPONENTS,
          )
          .flatMap((o) => o.params.componentIds),
      );

      const [tokenPoolTokens, componentWinnersWallets] = await Promise.all([
        this.tokenPoolTokenRepository.getTokenPoolsTokens(
          Array.from(tokenPoolIds),
        ),
        this.componentWinners.getWinnersByComponentIds({
          componentIds: Array.from(componentWinnersComponentIds),
        }),
      ]);

      const tokenPools: Record<string, TokenPool> = tokenPoolTokens.reduce<
        Record<string, TokenPool>
      >((acc, token) => {
        if (!acc[token.token_pool_id]) {
          acc[token.token_pool_id] = {
            id: token.token_pool_id,
            name: 'test',
            description: 'test',
            tokens: [],
            contract: token.contract,
            blockNo:
              createTokenPoolOpsMap.get(token.token_pool_id)?.params.blockNo ??
              null,
            consolidateBlockNo: createTokenPoolOpsMap.get(token.token_pool_id)
              ?.params.consolidateBlockNo,
          };
        }
        acc[token.token_pool_id].tokens.push(
          ...Array.from({ length: token.amount }, () => ({
            id: token.token_id,
            contract: token.contract,
            owner: token.wallet,
          })),
        );
        return acc;
      }, {});

      for (const tokenPool of Object.entries(tokenPools)) {
        const [tokenPoolId, pool] = tokenPool;
        allowlist.tokenPools[tokenPoolId] = pool;
      }

      const phaseComponentWinners: Record<string, AllowlistComponent> =
        componentWinnersWallets.reduce<Record<string, AllowlistComponent>>(
          (acc, winner) => {
            if (!acc[winner.phase_component_id]) {
              acc[winner.phase_component_id] = {
                id: winner.phase_component_id,
                name: 'test',
                description: 'test',
                items: {},
                winners: {},
                _insertionOrder: Object.values(acc).length,
              };
            }
            if (!acc[winner.phase_component_id].winners[winner.wallet]) {
              acc[winner.phase_component_id].winners[winner.wallet] =
                winner.amount;
            } else {
              acc[winner.phase_component_id].winners[winner.wallet] +=
                winner.amount;
            }
            return acc;
          },
          {},
        );

      for (const phaseComponentWinner of Object.entries(
        phaseComponentWinners,
      )) {
        const [phaseComponentId, component] = phaseComponentWinner;
        allowlist.phases[testPhaseId].components[phaseComponentId] = component;
      }

      for (const operation of allowlistOperations) {
        this.allowlistCreator.executeOperation({
          code: operation.code,
          params: operation.params,
          state: allowlist,
        });
      }

      return Array.from(phaseIds).reduce<number>((acc, phaseId) => {
        const phase = allowlist.phases[phaseId];
        if (!phase) return acc;
        const components = Object.values(phase.components);
        if (!components.length) return acc;
        const wallets = new Set<string>(
          components.flatMap((component) =>
            Object.values(component.items).flatMap((item) =>
              item.tokens.flatMap((token) => token.owner),
            ),
          ),
        );
        return acc + wallets.size;
      }, 0);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
