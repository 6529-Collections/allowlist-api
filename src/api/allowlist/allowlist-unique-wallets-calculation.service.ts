import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { associateByToMap } from '../../app.utils';
import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { AllowlistComponent } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-component';
import { TokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/token-pool';
import { Pool } from '@6529-collections/allowlist-lib/app-types';
import { randomUUID } from 'crypto';
import { PhaseComponentWinnerRepository } from '../../repository/phase-component-winner/phase-component-winner.repository';
import { TokenPoolTokenRepository } from '../../repository/token-pool-token/token-pool-token.repository';
import { UNIQUE_WALLET_COUNTS_OPS_RELEVANCY } from './allowlist.constants';
import { AllowlistState } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-state';
import { TokenPoolTokenEntity } from '../../repository/token-pool-token/token-pool-token.entity';
import { PhaseComponentWinnerEntity } from '../../repository/phase-component-winner/phase-component-winner.entity';

@Injectable()
export class AllowlistUniqueWalletsCalculationService {
  constructor(
    private readonly componentWinners: PhaseComponentWinnerRepository,
    private readonly tokenPoolTokenRepository: TokenPoolTokenRepository,
    private allowlistCreator: AllowlistCreator,
  ) {}

  private readonly logger = new Logger(
    AllowlistUniqueWalletsCalculationService.name,
  );

  async getUniqueWalletsCountFromOperations(
    originalOperations: AllowlistOperation[],
  ): Promise<number> {
    if (!originalOperations.length) {
      throw new BadRequestException('Operations are empty');
    }

    const relevantOperations = originalOperations.filter(
      (o) => UNIQUE_WALLET_COUNTS_OPS_RELEVANCY[o.code],
    );

    const { createTokenPoolOps, allowlistOperations } =
      this.toCreateAndOtherOps(relevantOperations);
    const createTokenPoolOpsMap = associateByToMap(
      createTokenPoolOps,
      (o) => o.params.id,
    );
    try {
      const allowlist = this.allowlistCreator.createAllowlistState();
      const { testPhaseId, phaseIds } = await this.addMockPhases(
        allowlist,
        allowlistOperations,
      );
      const tokenPoolIds = this.getTokenPoolIds(allowlistOperations);
      const componentWinnersComponentIds =
        this.getWinnerComponentIds(allowlistOperations);

      const [tokenPoolTokens, componentWinnersWallets] = await Promise.all([
        this.tokenPoolTokenRepository.getTokenPoolsTokens(
          Array.from(tokenPoolIds),
        ),
        this.componentWinners.getWinnersByComponentIds({
          componentIds: Array.from(componentWinnersComponentIds),
        }),
      ]);
      const tokenPools = this.getTokenPoolsByIds(
        tokenPoolTokens,
        createTokenPoolOpsMap,
      );
      this.attachTokenPoolsToAllowlist(tokenPools, allowlist);

      const phaseComponentWinners = this.getPhaseComponentWinnersByComponentIds(
        componentWinnersWallets,
      );

      for (const phaseComponentWinner of Object.entries(
        phaseComponentWinners,
      )) {
        const [phaseComponentId, component] = phaseComponentWinner;
        allowlist.phases[testPhaseId].components[phaseComponentId] = component;
      }

      for (const operation of allowlistOperations) {
        await this.allowlistCreator.executeOperation({
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

  private getPhaseComponentWinnersByComponentIds(
    componentWinnersWallets: PhaseComponentWinnerEntity[],
  ) {
    return componentWinnersWallets.reduce<Record<string, AllowlistComponent>>(
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
          acc[winner.phase_component_id].winners[winner.wallet] = winner.amount;
        } else {
          acc[winner.phase_component_id].winners[winner.wallet] +=
            winner.amount;
        }
        return acc;
      },
      {},
    );
  }

  private attachTokenPoolsToAllowlist(
    tokenPools: Record<string, TokenPool>,
    allowlist: AllowlistState,
  ) {
    for (const tokenPool of Object.entries(tokenPools)) {
      const [tokenPoolId, pool] = tokenPool;
      allowlist.tokenPools[tokenPoolId] = pool;
    }
  }

  private getTokenPoolsByIds(
    tokenPoolTokens: TokenPoolTokenEntity[],
    createTokenPoolOpsMap: Map<string, AllowlistOperation>,
  ): Record<string, TokenPool> {
    return tokenPoolTokens.reduce<Record<string, TokenPool>>((acc, token) => {
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
  }

  private getWinnerComponentIds(allowlistOperations: AllowlistOperation[]) {
    return new Set<string>(
      allowlistOperations
        .filter(
          (o) =>
            o.code ===
            AllowlistOperationCode.ITEM_REMOVE_WALLETS_FROM_CERTAIN_COMPONENTS,
        )
        .flatMap((o) => o.params.componentIds),
    );
  }

  private getTokenPoolIds(allowlistOperations: AllowlistOperation[]) {
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

    return new Set<string>(
      Array.from([...addItemTokenPoolIds, ...excludeTokenPoolIds]),
    );
  }

  private async addMockPhases(
    allowlist: AllowlistState,
    allowlistOperations: AllowlistOperation[],
  ) {
    await this.allowlistCreator.executeOperation({
      code: AllowlistOperationCode.CREATE_ALLOWLIST,
      params: {
        id: randomUUID(),
        name: 'test',
        description: 'test',
      },
      state: allowlist,
    });

    const testPhaseId = randomUUID();

    await this.allowlistCreator.executeOperation({
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
      await this.allowlistCreator.executeOperation({
        code: AllowlistOperationCode.ADD_PHASE,
        params: {
          id: phaseId,
          name: 'test',
          description: 'test',
        },
        state: allowlist,
      });
    }
    return { testPhaseId, phaseIds };
  }

  private toCreateAndOtherOps(relevantOperations: AllowlistOperation[]) {
    return relevantOperations.reduce<{
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
  }
}
