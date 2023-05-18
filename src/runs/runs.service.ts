import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AllowlistRunsRepository } from '../repositories/allowlist-runs/allowlist-runs.repository';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';
import { AllowlistsRepository } from '../repositories/allowlist/allowlists.repository';
import { AllowlistOperationsRepository } from '../repositories/allowlist-operations/allowlist-operations.repository';
import { AllowlistRunDto } from '../repositories/allowlist-runs/allowlist-runs.dto';
import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { AllowlistDto } from '../repositories/allowlist/allowlist.dto';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { TransferPoolsRepository } from '../repositories/transfer-pools/transfer-pools.repository';
import { AllowlistState } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-state';
import { TransferPoolTransfersRepository } from '../repositories/transfer-pool-transfers/transfer-pool-transfers.repository';
import { TokenPoolsRepository } from '../repositories/token-pools/token-pools.repository';
import { TokenPoolTokensRepository } from '../repositories/token-pool-tokens/token-pool-tokens.repository';
import { CustomTokenPoolsRepository } from '../repositories/custom-token-pools/custom-token-pools.repository';
import { CustomTokenPoolTokensRepository } from '../repositories/custom-token-pool-tokens/custom-token-pool-tokens.repository';
import { WalletPoolsRepository } from '../repositories/wallet-pools/wallet-pools.repository';
import { WalletPoolWalletsRepository } from '../repositories/wallet-pool-wallets/wallet-pool-wallets.repository';
import { PhasesRepository } from '../repositories/phases/phases.repository';
import { PhaseComponentsRepository } from '../repositories/phase-components/phase-components.repository';
import { PhaseComponentWinnersRepository } from '../repositories/phase-component-winners/phase-component-winners.repository';
import { PhaseComponentItemsRepository } from '../repositories/phase-component-items/phase-component-items.repository';
import { PhaseComponentItemTokensRepository } from '../repositories/phase-component-item-tokens/phase-component-item-tokens.repository';

@Injectable()
export class RunsService {
  private logger = new Logger(RunsService.name);
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject(AllowlistCreator.name) private allowlistCreator: AllowlistCreator,
    private readonly allowlistRunsRepository: AllowlistRunsRepository,
    private readonly allowlistsRepository: AllowlistsRepository,
    private readonly allowlistOperationsRepository: AllowlistOperationsRepository,
    private readonly transferPoolsRepository: TransferPoolsRepository,
    private readonly transferPoolTransfersRepository: TransferPoolTransfersRepository,
    private readonly tokenPoolsRepository: TokenPoolsRepository,
    private readonly tokenPoolTokensRepository: TokenPoolTokensRepository,
    private readonly customTokenPoolsRepository: CustomTokenPoolsRepository,
    private readonly customTokenPoolTokensRepository: CustomTokenPoolTokensRepository,
    private readonly walletPoolsRepository: WalletPoolsRepository,
    private readonly walletPoolWalletsRepository: WalletPoolWalletsRepository,
    private readonly phasesRepository: PhasesRepository,
    private readonly phaseComponentsRepository: PhaseComponentsRepository,
    private readonly phaseComponentWinnersRepository: PhaseComponentWinnersRepository,
    private readonly phaseComponentItemsRepository: PhaseComponentItemsRepository,
    private readonly phaseComponentItemTokensRepository: PhaseComponentItemTokensRepository,
  ) {}

  private async claimRun(): Promise<{
    run: AllowlistRunDto;
    allowlist: AllowlistDto;
  } | null> {
    const run = await this.allowlistRunsRepository.claim();
    if (!run) {
      this.logger.log(`No runs to claim`);
      return null;
    }
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();
    try {
      this.logger.log(`claiming run ${run.id}`);
      const allowlistDoc = await this.allowlistsRepository.setRun({
        id: run.allowlistId,
        runId: run.id,
        runCreatedAt: run.createdAt,
        session,
      });
      if (!allowlistDoc) {
        throw new Error(`Allowlist ${run.allowlistId} has newer run`);
      }

      await this.allowlistOperationsRepository.setRun({
        runId: run.id,
        allowlistId: run.allowlistId,
        session,
      });

      await session.commitTransaction();
      this.logger.log(`Run ${run.id} claimed`);
      return {
        run,
        allowlist: allowlistDoc,
      };
    } catch (e) {
      this.logger.error(`Error running run ${run.id}`, e);
      await session.abortTransaction();
      this.allowlistRunsRepository.fail(run.id);
      return null;
    } finally {
      session.endSession();
    }
  }

  async insertResults(param: {
    run: AllowlistRunDto;
    allowlist: AllowlistDto;
    results: AllowlistState;
  }): Promise<void> {
    const { run, allowlist, results } = param;
    const { id: runId } = run;
    const { transferPools, tokenPools, customTokenPools, walletPools, phases } =
      results;
    await Promise.all([
      this.transferPoolsRepository.createMany(
        Object.values(transferPools).map((transferPool) => ({
          allowlistId: allowlist.id,
          transferPoolId: transferPool.id,
          activeRunId: runId,
          contract: transferPool.contract,
          blockNo: transferPool.blockNo,
          name: transferPool.name,
          description: transferPool.description,
        })),
      ),
      this.transferPoolTransfersRepository.createMany(
        Object.values(transferPools).flatMap((transferPool) =>
          transferPool.transfers.map((transfer, i) => ({
            allowlistId: allowlist.id,
            transferPoolId: transferPool.id,
            activeRunId: runId,
            order: i,
            contract: transfer.contract,
            tokenID: transfer.tokenID,
            blockNumber: transfer.blockNumber,
            timeStamp: transfer.timeStamp,
            logIndex: transfer.logIndex,
            from: transfer.from,
            to: transfer.to,
            amount: transfer.amount,
            transactionHash: transfer.transactionHash,
            transactionIndex: transfer.transactionIndex,
          })),
        ),
      ),
      this.tokenPoolsRepository.createMany(
        Object.values(tokenPools).map((tokenPool) => ({
          allowlistId: allowlist.id,
          tokenPoolId: tokenPool.id,
          activeRunId: runId,
          name: tokenPool.name,
          description: tokenPool.description,
          transferPoolId: tokenPool.transferPoolId,
          tokenIds: tokenPool.tokenIds,
        })),
      ),
      this.tokenPoolTokensRepository.createMany(
        Object.values(tokenPools).flatMap((tokenPool) =>
          tokenPool.tokens.map((token, i) => ({
            allowlistId: allowlist.id,
            tokenPoolId: tokenPool.id,
            activeRunId: runId,
            order: i,
            tokenId: token.id,
            contract: token.contract,
            owner: token.owner,
            since: token.since,
          })),
        ),
      ),
      this.customTokenPoolsRepository.createMany(
        Object.values(tokenPools).map((tokenPool) => ({
          allowlistId: allowlist.id,
          customTokenPoolId: tokenPool.id,
          activeRunId: runId,
          name: tokenPool.name,
          description: tokenPool.description,
        })),
      ),
      this.customTokenPoolTokensRepository.createMany(
        Object.values(customTokenPools).flatMap((customTokenPool) =>
          customTokenPool.tokens.map((token, i) => ({
            allowlistId: allowlist.id,
            customTokenPoolId: customTokenPool.id,
            activeRunId: runId,
            order: i,
            tokenId: token.id,
            owner: token.owner,
            since: token.since,
          })),
        ),
      ),
      this.walletPoolsRepository.createMany(
        Object.values(walletPools).map((walletPool) => ({
          allowlistId: allowlist.id,
          walletPoolId: walletPool.id,
          activeRunId: runId,
          name: walletPool.name,
          description: walletPool.description,
        })),
      ),
      this.walletPoolWalletsRepository.createMany(
        Object.values(walletPools).flatMap((walletPool) =>
          walletPool.wallets.map((wallet, i) => ({
            allowlistId: allowlist.id,
            walletPoolId: walletPool.id,
            activeRunId: runId,
            order: i,
            wallet,
          })),
        ),
      ),
      this.phasesRepository.createMany(
        Object.values(phases).map((phase) => ({
          allowlistId: allowlist.id,
          phaseId: phase.id,
          activeRunId: runId,
          name: phase.name,
          description: phase.description,
          insertionOrder: phase._insertionOrder,
        })),
      ),
      this.phaseComponentsRepository.createMany(
        Object.values(phases).flatMap((phase) =>
          Object.values(phase.components).map((component, i) => ({
            allowlistId: allowlist.id,
            phaseId: phase.id,
            componentId: component.id,
            activeRunId: runId,
            insertionOrder: component._insertionOrder,
            name: component.name,
            description: component.description,
          })),
        ),
      ),
      this.phaseComponentWinnersRepository.createMany(
        Object.values(phases).flatMap((phase) =>
          Object.values(phase.components).flatMap((component) =>
            Object.entries(component.winners).map(([wallet, amount]) => ({
              allowlistId: allowlist.id,
              phaseId: phase.id,
              componentId: component.id,
              activeRunId: runId,
              wallet,
              amount,
            })),
          ),
        ),
      ),
      this.phaseComponentItemsRepository.createMany(
        Object.values(phases).flatMap((phase) =>
          Object.values(phase.components).flatMap((component) =>
            Object.values(component.items).map((item) => ({
              allowlistId: allowlist.id,
              phaseId: phase.id,
              phaseComponentId: component.id,
              phaseComponentItemId: item.id,
              activeRunId: runId,
              name: item.name,
              description: item.description,
              insertionOrder: item._insertionOrder,
            })),
          ),
        ),
      ),
      this.phaseComponentItemTokensRepository.createMany(
        Object.values(phases).flatMap((phase) =>
          Object.values(phase.components).flatMap((component) =>
            Object.values(component.items).flatMap((item) =>
              item.tokens.map((token, i) => ({
                allowlistId: allowlist.id,
                phaseId: phase.id,
                phaseComponentId: component.id,
                phaseComponentItemId: item.id,
                activeRunId: runId,
                order: i,
                tokenId: token.id,
                owner: token.owner,
                since: token.since,
              })),
            ),
          ),
        ),
      ),
    ]);
  }

  async run(params: {
    run: AllowlistRunDto;
    allowlist: AllowlistDto;
  }): Promise<AllowlistState> {
    const {
      run: { id: runId },
      allowlist: {
        id: allowlistId,
        name: allowlistName,
        description: allowlistDescription,
      },
    } = params;
    this.logger.log(`Getting operations for run ${runId}`);
    const operations: AllowlistOperation[] = (
      await this.allowlistOperationsRepository.getOperationsForRun(runId)
    ).map((operation) => ({
      code: operation.code,
      params: operation.params,
    }));
    return await this.allowlistCreator.execute([
      {
        code: AllowlistOperationCode.CREATE_ALLOWLIST,
        params: {
          id: allowlistId,
          name: allowlistName,
          description: allowlistDescription,
        },
      },
      ...operations,
    ]);
  }

  //@Timeout(0)
  async start(): Promise<void> {
    const params = await this.claimRun();
    if (!params || !params.run || !params.allowlist) {
      return;
    }
    console.time('AllowlistRunService');
    await Promise.all([
      this.transferPoolTransfersRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.transferPoolsRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.tokenPoolsRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.tokenPoolTokensRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.customTokenPoolsRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.customTokenPoolTokensRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.walletPoolsRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.walletPoolWalletsRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.phasesRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.phaseComponentsRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.phaseComponentWinnersRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.phaseComponentItemsRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
      this.phaseComponentItemTokensRepository.deleteByAllowlistId({
        allowlistId: params.run.allowlistId,
      }),
    ]);
    this.logger.log(`running ${params.run.id}`);
    try {
      const results = await this.run(params);
      this.logger.log(`Inserting results for run ${params.run.id}`);
      // fs.writeFileSync(
      //   `./results/${params.run.id}.json`,
      //   JSON.stringify(results, null, 2),
      // );
      await this.insertResults({
        run: params.run,
        allowlist: params.allowlist,
        results,
      });
      this.logger.log(`Run ${params.run.id} finished`);
      await this.allowlistRunsRepository.complete(params.run.id);
    } catch (e) {
      console.log(e);
      this.logger.error(`Error running ${params.run.id}`);
      await this.allowlistRunsRepository.fail(params.run.id);
    }

    console.timeEnd('AllowlistRunService');
  }
}
