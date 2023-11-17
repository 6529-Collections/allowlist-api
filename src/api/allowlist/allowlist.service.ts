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
import { AllowlistUserRepository } from '../../repository/allowlist-user/allowlist-user.repository';
import { SeizeApiService } from '../../seize-api/seize-api.service';

@Injectable()
export class AllowlistService {
  constructor(
    private readonly allowlistRepository: AllowlistRepository,
    private readonly commonService: CommonService,
    private readonly runnerProxy: RunnerProxy,
    private readonly db: DB,
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
    if (process.env.DEV_MODE === 'true') {
      return true;
    }
    if (tdh < 1) {
      return false;
    }
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
}
