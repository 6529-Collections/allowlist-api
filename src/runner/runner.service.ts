import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { Injectable, Logger } from '@nestjs/common';
import { AllowlistRepository } from '../repository/allowlist/allowlist.repository';
import { AllowlistOperationRepository } from '../repository/allowlist-operation/allowlist-operation.repository';
import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { TransferPoolRepository } from '../repository/transfer-pool/transfer-pool.repository';
import { AllowlistState } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-state';
import { TokenPoolRepository } from '../repository/token-pool/token-pool.repository';
import { CustomTokenPoolRepository } from '../repository/custom-token-pool/custom-token-pool.repository';
import { WalletPoolRepository } from '../repository/wallet-pool/wallet-pool.repository';
import { PhaseRepository } from '../repository/phase/phase.repository';
import { PhaseComponentRepository } from '../repository/phase-components/phase-component.repository';
import { PhaseComponentWinnerRepository } from '../repository/phase-component-winner/phase-component-winner.repository';
import { PhaseComponentItemRepository } from '../repository/phase-component-item/phase-component-item.repository';
import { AllowlistEntity } from '../repository/allowlist/allowlist.entity';
import { DB } from '../repository/db';
import { PhaseComponentItemEntity } from '../repository/phase-component-item/phase-component-item.entity';
import { Time } from '../time';

@Injectable()
export class RunnerService {
  private logger = new Logger(RunnerService.name);

  constructor(
    private allowlistCreator: AllowlistCreator,
    private readonly allowlistRepository: AllowlistRepository,
    private readonly allowlistOperationRepository: AllowlistOperationRepository,
    private readonly transferPoolRepository: TransferPoolRepository,
    private readonly tokenPoolRepository: TokenPoolRepository,
    private readonly customTokenPoolRepository: CustomTokenPoolRepository,
    private readonly walletPoolRepository: WalletPoolRepository,
    private readonly phaseRepository: PhaseRepository,
    private readonly phaseComponentRepository: PhaseComponentRepository,
    private readonly phaseComponentWinnerRepository: PhaseComponentWinnerRepository,
    private readonly phaseComponentItemRepository: PhaseComponentItemRepository,
    private readonly db: DB,
  ) {}

  private async claimRun(allowlistId: string): Promise<AllowlistEntity | null> {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const run = await this.allowlistRepository.claimRun(allowlistId, {
        connection,
      });
      if (!run) {
        this.logger.log(`Allowlist ${allowlistId} hasn't got an unclaimed run`);
        await connection.commit();
        return null;
      }
      this.logger.log(`claiming run for allowlist ${allowlistId}`);
      const allowlistDoc = await this.allowlistRepository.findById(
        allowlistId,
        {
          connection,
        },
      );
      if (!allowlistDoc) {
        throw new Error(`Allowlist ${allowlistId} does not exist`);
      }

      await this.allowlistOperationRepository.setAllAsNotRan(
        {
          allowlistId,
        },
        {
          connection,
        },
      );

      this.logger.log(`Run for allowlist ${allowlistId} claimed`);
      await connection.commit();
      return allowlistDoc;
    } catch (e) {
      this.logger.error(`Error running run for allowlist ${allowlistId}`, e);
      await connection.rollback();
      await this.allowlistRepository.changeStatusToError({
        allowlistId,
        errorReason:
          typeof e === 'string'
            ? e
            : typeof e.message === 'string'
            ? e.message
            : JSON.stringify(e),
      });
      return null;
    } finally {
      await connection.end();
    }
  }

  async insertResults(param: {
    allowlist: AllowlistEntity;
    results: AllowlistState;
  }): Promise<void> {
    const { allowlist, results } = param;
    const { transferPools, tokenPools, customTokenPools, walletPools, phases } =
      results;
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      await Promise.all([
        this.transferPoolRepository.createMany(
          Object.values(transferPools).map((transferPool) => ({
            allowlist_id: allowlist.id,
            id: transferPool.id,
            contract: transferPool.contract,
            block_no: transferPool.blockNo,
            name: transferPool.name,
            description: transferPool.description,
            transfers_count: transferPool.transfers.length,
          })),
          { connection },
        ),
        this.tokenPoolRepository.createMany(
          Object.values(tokenPools).map((tokenPool) => ({
            allowlist_id: allowlist.id,
            id: tokenPool.id,
            name: tokenPool.name,
            description: tokenPool.description,
            token_ids: tokenPool.tokenIds,
            tokens_count: tokenPool.tokens.length,
            wallets_count: new Set(tokenPool.tokens.map((token) => token.owner))
              .size,
          })),
          { connection },
        ),
        this.customTokenPoolRepository.createMany({
          entities: Object.values(customTokenPools).map((tokenPool) => ({
            allowlist_id: allowlist.id,
            id: tokenPool.id,
            name: tokenPool.name,
            description: tokenPool.description,
            tokens_count: tokenPool.tokens.length,
            wallets_count: new Set(tokenPool.tokens.map((token) => token.owner))
              .size,
          })),
          options: { connection },
        }),
        this.walletPoolRepository.createMany(
          Object.values(walletPools).map((walletPool) => ({
            allowlist_id: allowlist.id,
            id: walletPool.id,
            name: walletPool.name,
            description: walletPool.description,
            wallets_count: walletPool.wallets.length,
          })),
          { connection },
        ),
        this.phaseRepository.createMany(
          Object.values(phases).map((phase) => ({
            allowlist_id: allowlist.id,
            id: phase.id,
            name: phase.name,
            description: phase.description,
            insertion_order: phase._insertionOrder,
            tokens_count: Object.values(phase.components).reduce<number>(
              (acc, component) =>
                acc +
                Object.values(component.items).reduce<number>(
                  (acc2, item) => acc2 + item.tokens.length,
                  0,
                ),
              0,
            ),
            wallets_count: new Set(
              Object.values(phase.components).flatMap((component) =>
                Object.values(component.items).flatMap((item) =>
                  item.tokens.map((token) => token.owner),
                ),
              ),
            ).size,
            winners_wallets_count: new Set(
              Object.values(phase.components).flatMap((component) =>
                Object.keys(component.winners),
              ),
            ).size,
            winners_spots_count: Object.values(phase.components).reduce<number>(
              (acc, component) =>
                acc +
                Object.values(component.winners).reduce<number>(
                  (acc2, winner) => acc2 + winner,
                  0,
                ),
              0,
            ),
          })),
          { connection },
        ),
        this.phaseComponentRepository.createMany(
          Object.values(phases).flatMap((phase) =>
            Object.values(phase.components).map((component, i) => ({
              id: component.id,
              allowlist_id: allowlist.id,
              phase_id: phase.id,
              insertion_order: component._insertionOrder,
              name: component.name,
              description: component.description,
              tokens_count: Object.values(component.items).reduce<number>(
                (acc, item) => acc + item.tokens.length,
                0,
              ),
              wallets_count: new Set(
                Object.values(component.items).flatMap((item) =>
                  item.tokens.map((token) => token.owner),
                ),
              ).size,
              winners_wallets_count: Object.keys(component.winners).length,
              winners_spots_count: Object.values(
                component.winners,
              ).reduce<number>((acc, winner) => acc + winner, 0),
            })),
          ),
          { connection },
        ),
        this.phaseComponentWinnerRepository.createMany(
          Object.values(phases).flatMap((phase) =>
            Object.values(phase.components).flatMap((component) =>
              Object.entries(component.winners).map(([wallet, amount]) => ({
                allowlist_id: allowlist.id,
                phase_id: phase.id,
                phase_component_id: component.id,
                wallet,
                amount,
              })),
            ),
          ),
          { connection },
        ),
        this.phaseComponentItemRepository.createMany(
          Object.values(phases).flatMap((phase) =>
            Object.values(phase.components).flatMap((component) =>
              Object.values(component.items).map<PhaseComponentItemEntity>(
                (item) => ({
                  allowlist_id: allowlist.id,
                  phase_id: phase.id,
                  phase_component_id: component.id,
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  pool_id: item.poolId,
                  pool_type: item.poolType,
                  insertion_order: item._insertionOrder,
                  tokens_count: item.tokens.length,
                  wallets_count: new Set(
                    item.tokens.map((token) => token.owner),
                  ).size,
                }),
              ),
            ),
          ),
          { connection },
        ),
      ]);
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      await connection.end();
    }
  }

  async run(allowlist: AllowlistEntity): Promise<AllowlistState> {
    const allowlistId = allowlist.id;
    this.logger.log(`Getting operations for allowlist ${allowlistId}`);
    const operations: AllowlistOperation[] = (
      await this.allowlistOperationRepository.findByAllowlistId(allowlistId)
    ).map((operation) => ({
      code: operation.code,
      params: operation.params
        ? JSON.parse(operation.params)
        : operation.params,
    }));
    return await Promise.race([
      Time.minutes(14)
        .sleep()
        .then(() => {
          throw new Error(
            `Executing allowlist ${allowlistId} timed out after 14 minutes`,
          );
        }),

      this.allowlistCreator.execute([
        {
          code: AllowlistOperationCode.CREATE_ALLOWLIST,
          params: {
            id: allowlistId,
            name: allowlist.name,
            description: allowlist.description,
          },
        },
        ...operations,
      ]),
    ]);
  }

  async start(allowlistId: string): Promise<void> {
    const allowlist = await this.claimRun(allowlistId);
    if (!allowlist) {
      this.logger.log(`Allowlist ${allowlistId} not found. Finishing`);
      return;
    }
    this.logger.log(`Starting run for allowlist ${allowlistId}`);
    console.time('AllowlistRunService');
    try {
      const results = await this.run(allowlist);
      this.logger.log(`Inserting results for run for allowlist ${allowlistId}`);
      // fs.writeFileSync(
      //   `./results/${params.run.id}.json`,
      //   JSON.stringify(results, null, 2),
      // );
      await this.insertResults({
        allowlist,
        results,
      });
      this.logger.log(`Run for ${allowlist} finished`);
      await this.allowlistOperationRepository.setAllAsRan({ allowlistId });
      await this.allowlistRepository.changeStatusToCompleted({
        allowlistId,
      });
    } catch (e) {
      console.error(e);
      this.logger.error(`Error running for allowlist ${allowlistId}`);
      await this.allowlistRepository.changeStatusToError({
        allowlistId,
        errorReason:
          typeof e === 'string'
            ? e
            : typeof e.message === 'string'
            ? e.message
            : JSON.stringify(e),
      });
    }

    console.timeEnd('AllowlistRunService');
  }
}
