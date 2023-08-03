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
import { createAllowlistState } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-state';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { AllowlistComponent } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-component';
import { TokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/token-pool';
import { Pool } from '@6529-collections/allowlist-lib/app-types';
import { randomUUID } from 'crypto';
import { PhaseComponentWinnerRepository } from '../../repository/phase-component-winner/phase-component-winner.repository';
import { TokenPoolTokenRepository } from '../../repository/token-pool-token/token-pool-token.repository';

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

  async getAll(): Promise<AllowlistDescriptionResponseApiModel[]> {
    const entities = await this.allowlistRepository.findAll();
    return entities.map(this.allowlistEntityToResponseModel);
  }

  async create(
    param: AllowlistDescriptionRequestApiModel,
  ): Promise<AllowlistDescriptionResponseApiModel> {
    const entity = await this.allowlistRepository.save({
      ...param,
      created_at: BigInt(Time.currentMillis()),
    });
    return this.allowlistEntityToResponseModel(entity);
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
    const haveCreateTokenPoolOperation = operations.some(
      (o) => o.code === AllowlistOperationCode.CREATE_TOKEN_POOL,
    );

    if (haveCreateTokenPoolOperation) {
      throw new BadRequestException(
        'CREATE_TOKEN_POOL operation is not allowed, please contact support',
      );
    }
    try {
      const allowlist = createAllowlistState();
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
        operations
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
        operations
          .filter(
            (o) =>
              o.code === AllowlistOperationCode.ADD_ITEM &&
              o.params.poolType === Pool.TOKEN_POOL,
          )
          .map((o) => o.params.poolId),
      );

      const excludeTokenPoolIds = new Set(
        operations.flatMap((o) => {
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
        operations
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

      for (const operation of operations) {
        this.allowlistCreator.executeOperation({
          code: operation.code,
          params: operation.params,
          state: allowlist,
        });
      }

      const uniqueWalletsCount = Array.from(phaseIds).reduce<number>(
        (acc, phaseId) => {
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
        },
        0,
      );
      return uniqueWalletsCount;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
