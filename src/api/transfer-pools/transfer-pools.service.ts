import { BadRequestException, Injectable } from '@nestjs/common';
import { TransferPoolsRepository } from '../../repositories/transfer-pools/transfer-pools.repository';
import { TransferPoolResponseApiModel } from './models/transfer-pool-response-api.model';

@Injectable()
export class TransferPoolsService {
  constructor(
    private readonly transferPoolsRepository: TransferPoolsRepository,
  ) {}

  async getByAllowlistId(
    allowlistId: string,
  ): Promise<TransferPoolResponseApiModel[]> {
    return this.transferPoolsRepository.getByAllowlistId(allowlistId);
  }

  async getTransferPool(param: {
    allowlistId: string;
    transferPoolId: string;
  }): Promise<TransferPoolResponseApiModel> {
    const { allowlistId, transferPoolId } = param;
    const transferPool = this.transferPoolsRepository.getAllowlistTransferPool({
      allowlistId,
      transferPoolId,
    });
    if (!transferPool) {
      throw new BadRequestException('Transfer pool not found');
    }
    return transferPool;
  }
}
