import { BadRequestException, Injectable } from '@nestjs/common';
import { TransferPoolRepository } from '../../repository/transfer-pool/transfer-pool.repository';
import { TransferPoolResponseApiModel } from './model/transfer-pool-response-api.model';
import { TransferPoolEntity } from '../../repository/transfer-pool/transfer-pool.entity';

@Injectable()
export class TransferPoolService {
  constructor(
    private readonly transferPoolRepository: TransferPoolRepository,
  ) {}

  private entityToApiModel(
    entity: TransferPoolEntity,
  ): TransferPoolResponseApiModel {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      contract: entity.contract,
      blockNo: entity.block_no,
      allowlistId: entity.allowlist_id,
      transfersCount: entity.transfers_count,
    };
  }

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<TransferPoolResponseApiModel[]> {
    const entities = await this.transferPoolRepository.getByAllowlistId(
      allowlistId,
    );
    return entities.map(this.entityToApiModel);
  }

  async getTransferPool(param: {
    allowlistId: string;
    transferPoolId: string;
  }): Promise<TransferPoolResponseApiModel> {
    const { allowlistId, transferPoolId } = param;
    const transferPool =
      await this.transferPoolRepository.getAllowlistTransferPool({
        allowlistId,
        transferPoolId,
      });
    if (!transferPool) {
      throw new BadRequestException('Transfer pool not found');
    }
    return this.entityToApiModel(transferPool);
  }
}
