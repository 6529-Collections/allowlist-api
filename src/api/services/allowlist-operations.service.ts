import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AllowlistOperationRequestApiModel } from '../models/allowlist-operation-request-api.model';
import { AllowlistOperationsRepository } from '../../repositories/allowlist-operations/allowlist-operations.repository';
import { AllowlistsRepository } from '../../repositories/allowlist/allowlists.repository';
import { AllowlistOperationResponseApiModel } from '../models/allowlist-operation-response-api.model';
import { Time } from '../../time';
import { ClientSession, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';

@Injectable()
export class AllowlistOperationsService {
  constructor(
    private readonly allowlistsRepository: AllowlistsRepository,
    private readonly allowlistOperationsRepository: AllowlistOperationsRepository,
    @InjectConnection()
    private readonly connection: Connection,
    @Inject(AllowlistCreator.name) private allowlistCreator: AllowlistCreator,
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

  async add({
    code,
    params,
    order,
    allowlistId,
  }: AllowlistOperationRequestApiModel & {
    allowlistId: string;
  }): Promise<AllowlistOperationResponseApiModel> {
    const allowlist = await this.allowlistsRepository.findById(allowlistId);
    if (!allowlist) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }

    await this.validateOperation({ code, params });
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.allowlistOperationsRepository.incOrdersForAllowlistSinceOrder(
        {
          sinceOrder: order,
          allowlistId,
        },
        session,
      );
      const dto = await this.allowlistOperationsRepository.save(
        {
          code,
          params,
          order,
          allowlistId,
          createdAt: Time.currentMillis(),
        },
        session,
      );
      const ranLaterOperations =
        await this.allowlistOperationsRepository.getAllRanForAllowlistSinceOrder(
          {
            allowlistId,
            order,
          },
          session,
        );
      if (ranLaterOperations.length > 0) {
        await this.allowlistOperationsRepository.updateAllForAllowlistToNeverRan(
          allowlistId,
          session,
        );
      }
      await session.commitTransaction();

      return {
        code: dto.code,
        params: dto.params,
        order: dto.order,
        createdAt: dto.createdAt,
        hasRan: false,
      };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }

  async delete({
    allowlistId,
    operationOrder,
  }: {
    allowlistId: string;
    operationOrder: number;
  }) {
    const allowlist = await this.allowlistsRepository.findById(allowlistId);
    if (!allowlist) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlist} does not exist`,
      );
    }
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.allowlistOperationsRepository.delete(
        {
          order: operationOrder,
          allowlistId,
        },
        session,
      );
      await this.allowlistOperationsRepository.decOrdersForAllowlistSinceOrder(
        {
          sinceOrder: operationOrder,
          allowlistId,
        },
        session,
      );
      const ranLaterOperations =
        await this.allowlistOperationsRepository.getAllRanForAllowlistSinceOrder(
          {
            allowlistId,
            order: operationOrder,
          },
          session,
        );
      if (ranLaterOperations.length > 0) {
        await this.allowlistOperationsRepository.updateAllForAllowlistToNeverRan(
          allowlistId,
          session,
        );
      }
      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }
}
