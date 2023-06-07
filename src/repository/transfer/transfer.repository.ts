import { Injectable, Logger } from '@nestjs/common';
import { TransfersStorage } from '@6529-collections/allowlist-lib/services/transfers.storage';
import { Transfer } from '@6529-collections/allowlist-lib/allowlist/state-types/transfer';
import { DB } from '../db';
import { TransferEntity } from './transfer.entity';
import { bigInt2Number } from '../../app.utils';

@Injectable()
export class TransferRepository implements TransfersStorage {
  private readonly logger = new Logger(TransferRepository.name);

  constructor(private readonly db: DB) {}

  async getLatestTransferBlockNo(contract: string): Promise<number> {
    const resp = await this.db.one<TransferEntity>(
      `SELECT block_number
             FROM transfer
             WHERE contract = ?
             ORDER BY block_number DESC, transaction_index DESC, log_index DESC
             LIMIT 1`,
      [contract],
    );
    return resp?.block_number || 0;
  }

  async getContractTransfersOrdered(
    contract: string,
    blockNo: number,
  ): Promise<Transfer[]> {
    const entities = await this.db.many<TransferEntity>(
      `SELECT transaction_hash,
                    amount,
                    block_number,
                    contract,
                    from_party,
                    to_party,
                    log_index,
                    timestamp,
                    token_id,
                    transaction_index
             FROM transfer
             WHERE contract = ?
               AND block_number <= ?
             ORDER BY block_number, transaction_index, log_index`,
      [contract, blockNo],
    );
    this.logger.log(
      `Pulled ${entities.length} transfers from DB for contract ${contract}`,
    );
    return entities.map((e) => ({
      amount: e.amount,
      blockNumber: e.block_number,
      contract: e.contract,
      from: e.from_party,
      logIndex: e.log_index,
      timeStamp: bigInt2Number(e.time_stamp),
      to: e.to_party,
      tokenID: e.token_id,
      transactionHash: e.transaction_hash,
      transactionIndex: e.transaction_index,
    }));
  }

  async saveContractTransfers(
    contract: string,
    transfers: Transfer[],
  ): Promise<void> {
    const entities = transfers.map<TransferEntity>((t) => ({
      amount: t.amount,
      block_number: t.blockNumber,
      contract: t.contract,
      from_party: t.from,
      log_index: t.logIndex,
      time_stamp: BigInt(t.timeStamp),
      to_party: t.to,
      token_id: t.tokenID,
      transaction_hash: t.transactionHash,
      transaction_index: t.transactionIndex,
      blockNumber: t.blockNumber,
    }));
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      for (const entity of entities) {
        await this.db.none(
          `INSERT INTO transfer (transaction_hash, amount, block_number, contract, from_party, to_party,
                                           log_index, timestamp, token_id, transaction_index)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE transaction_hash = transaction_hash`,
          [
            entity.transaction_hash,
            entity.amount,
            entity.block_number,
            entity.contract,
            entity.from_party,
            entity.to_party,
            entity.log_index,
            entity.time_stamp,
            entity.token_id,
            entity.transaction_index,
          ],
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
}
