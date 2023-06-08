import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { TransferModel } from './transfer.model';
import { InjectModel } from '@nestjs/mongoose';
import { TransfersStorage } from '@6529-collections/allowlist-lib/services/transfers.storage';
import { Transfer } from '@6529-collections/allowlist-lib/allowlist/state-types/transfer';
import { AnyBulkWriteOperation } from 'mongodb';

@Injectable()
export class TransferRepository implements TransfersStorage {
  constructor(
    @InjectModel(TransferModel.name)
    private readonly transfers: Model<TransferModel>,
  ) {}

  async getLatestTransferBlockNo(contract: string): Promise<number> {
    const latestTransfer = await this.transfers.findOne({ contract }, null, {
      sort: {
        contract: 1,
        blockNumber: -1,
        transactionIndex: -1,
        transactionHash: 1,
        logIndex: -1,
        tokenID: 1,
      },
      hint: {
        contract: 1,
        blockNumber: -1,
        transactionIndex: -1,
        transactionHash: 1,
        logIndex: -1,
        tokenID: 1,
      },
    });
    return latestTransfer ? latestTransfer.blockNumber : 0;
  }

  async getContractTransfersOrdered(
    contract: string,
    blockNo: number,
  ): Promise<Transfer[]> {
    return this.transfers.find(
      { contract, blockNumber: { $lte: blockNo } },
      null,
      {
        sort: {
          contract: 1,
          blockNumber: -1,
          transactionIndex: -1,
          transactionHash: 1,
          logIndex: -1,
          tokenID: 1,
        },
        hint: {
          contract: 1,
          blockNumber: -1,
          transactionIndex: -1,
          transactionHash: 1,
          logIndex: -1,
          tokenID: 1,
        },
      },
    );
  }

  async saveContractTransfers(
    contract: string,
    transfers: Transfer[],
  ): Promise<void> {
    if (!transfers.length) return;
    const bulkWriteOps: AnyBulkWriteOperation<Transfer>[] = transfers.map(
      (transfer) => ({
        updateOne: {
          filter: {
            contract,
            blockNumber: transfer.blockNumber,
            transactionIndex: transfer.transactionIndex,
            transactionHash: transfer.transactionHash,
            logIndex: transfer.logIndex,
            tokenID: transfer.tokenID,
          },
          update: {
            $setOnInsert: {
              ...transfer,
            },
          },
          upsert: true,
          hint: {
            contract: 1,
            blockNumber: -1,
            transactionIndex: -1,
            transactionHash: 1,
            logIndex: -1,
            tokenID: 1,
          },
        },
      }),
    );

    await this.transfers.bulkWrite(bulkWriteOps, { ordered: false });
  }
}
