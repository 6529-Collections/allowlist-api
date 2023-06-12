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

@Injectable()
export class AllowlistService {
  constructor(
    private readonly allowlistRepository: AllowlistRepository,
    private readonly commonService: CommonService,
    private readonly runnerProxy: RunnerProxy,
    private readonly db: DB,
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
}
