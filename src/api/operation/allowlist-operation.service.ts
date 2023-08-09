import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AllowlistOperationRequestApiModel } from './model/allowlist-operation-request-api.model';
import { AllowlistOperationRepository } from '../../repository/allowlist-operation/allowlist-operation.repository';
import { AllowlistRepository } from '../../repository/allowlist/allowlist.repository';
import { Time } from '../../time';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { AllowlistOperationResponseApiModel } from './model/allowlist-operation-response-api.model';
import { AllowlistRunStatus } from '../allowlist/model/allowlist-run-status';
import { AllowlistOperationEntity } from '../../repository/allowlist-operation/allowlist-operation.entity';
import { bigInt2Number } from '../../app.utils';
import { randomUUID } from 'crypto';
import { DB } from '../../repository/db';
import { TokenPoolAsyncDownloader } from '../../token-pool/token-pool-async-downloader';

@Injectable()
export class AllowlistOperationService {
  constructor(
    private readonly allowlistRepository: AllowlistRepository,
    private readonly allowlistOperationRepository: AllowlistOperationRepository,
    private allowlistCreator: AllowlistCreator,
    private readonly tokenPoolAsyncDownloader: TokenPoolAsyncDownloader,
    private readonly db: DB,
  ) {}

  private validateOperation(params: {
    code: AllowlistOperationCode;
    params: any;
  }) {
    try {
      this.allowlistCreator.validateOperation(params);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  private async validateAllowlistState(allowlistId: string): Promise<void> {
    const allowlist = await this.allowlistRepository.findById(allowlistId);
    if (!allowlist) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }
    if (!allowlist.run_status) {
      return;
    }

    if (
      [AllowlistRunStatus.PENDING, AllowlistRunStatus.CLAIMED].includes(
        allowlist.run_status as AllowlistRunStatus,
      )
    ) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} has an active run`,
      );
    }
  }

  async add({
    code,
    params,
    order: orderParam,
    allowlistId,
  }: AllowlistOperationRequestApiModel & {
    allowlistId: string;
  }): Promise<AllowlistOperationResponseApiModel> {
    this.validateOperation({ code, params });
    await this.validateAllowlistState(allowlistId);
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const order =
        orderParam ??
        (await this.allowlistOperationRepository.getLatestOrderForAllowlist(
          allowlistId,
          { connection },
        )) + 1;
      await this.allowlistOperationRepository.incOrdersForAllowlistSinceOrder(
        {
          sinceOrder: order,
          allowlistId,
        },
        { connection },
      );
      const entity = await this.allowlistOperationRepository.save(
        {
          id: randomUUID(),
          code,
          params: params ? JSON.stringify(params) : undefined,
          op_order: order,
          allowlist_id: allowlistId,
          created_at: BigInt(Time.currentMillis()),
          has_ran: false,
        },
        { connection },
      );
      const ranLaterOperations =
        await this.allowlistOperationRepository.getAllRanForAllowlistSinceOrder(
          {
            allowlistId,
            order,
          },
          { connection },
        );
      if (ranLaterOperations.length > 0) {
        await this.allowlistOperationRepository.updateAllForAllowlistToNotRan(
          allowlistId,
          { connection },
        );
      }
      await connection.commit();

      if (code === AllowlistOperationCode.CREATE_TOKEN_POOL) {
        await this.tokenPoolAsyncDownloader.start({
          config: {
            tokenPoolId: params.id,
            tokenIds: params.tokenIds,
            contract: params.contract,
            blockNo: params.blockNo,
            consolidateBlockNo: params.consolidateBlockNo,
            allowlistId,
          },
          state: {
            runsCount: 0,
            startingBlocks: [],
          },
        });
      }

      return this.allowlistOperationEntityToApiModel(entity);
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      await connection.end();
    }
  }

  async addBatch(
    ops: {
      allowlistId: string;
      code: AllowlistOperationCode;
      params: any;
      order?: number;
    }[],
  ): Promise<AllowlistOperationResponseApiModel[]> {
    const response: AllowlistOperationResponseApiModel[] = [];
    for (const op of ops) {
      const result = await this.add(op);
      response.push(result);
    }
    return response;
  }

  async findByAllowlistId(
    allowlistId: string,
  ): Promise<AllowlistOperationResponseApiModel[]> {
    const entities = await this.allowlistOperationRepository.findByAllowlistId(
      allowlistId,
    );
    return entities.map(this.allowlistOperationEntityToApiModel);
  }

  async delete({
    allowlistId,
    operationOrder,
  }: {
    allowlistId: string;
    operationOrder: number;
  }) {
    await this.validateAllowlistState(allowlistId);
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      await this.allowlistOperationRepository.delete(
        {
          order: operationOrder,
          allowlistId,
        },
        { connection },
      );
      await this.allowlistOperationRepository.decOrdersForAllowlistSinceOrder(
        {
          sinceOrder: operationOrder,
          allowlistId,
        },
        { connection },
      );
      const ranLaterOperations =
        await this.allowlistOperationRepository.getAllRanForAllowlistSinceOrder(
          {
            allowlistId,
            order: operationOrder,
          },
          { connection },
        );
      if (ranLaterOperations.length > 0) {
        await this.allowlistOperationRepository.updateAllForAllowlistToNotRan(
          allowlistId,
          { connection },
        );
      }
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      await connection.end();
    }
  }

  private allowlistOperationEntityToApiModel(
    entity: AllowlistOperationEntity,
  ): AllowlistOperationResponseApiModel {
    return {
      id: entity.id,
      code: entity.code,
      params: entity.params ? JSON.parse(entity.params) : entity.params,
      order: entity.op_order,
      allowlistId: entity.allowlist_id,
      createdAt: bigInt2Number(entity.created_at),
      hasRan: !!entity.has_ran,
    };
  }
}
