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

  async getLatestTransferBlockNo({
    contract,
    transferType,
  }: {
    contract: string;
    transferType?: 'single' | 'batch';
  }): Promise<number> {
    if (transferType) {
      const resp = await this.db.one<TransferEntity>(
        `SELECT block_number
                 FROM transfer
                 WHERE contract = ? and transfer_type = ?
                 ORDER BY block_number DESC, transaction_index DESC, log_index DESC
                 LIMIT 1`,
        [contract, transferType],
      );
      return resp?.block_number || 0;
    } else {
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
                    transaction_index,
                    transfer_type
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
      amount: bigInt2Number(e.amount),
      blockNumber: e.block_number,
      contract: e.contract,
      from: e.from_party,
      logIndex: e.log_index,
      timeStamp: bigInt2Number(e.time_stamp),
      to: e.to_party,
      tokenID: e.token_id,
      transactionHash: e.transaction_hash,
      transactionIndex: e.transaction_index,
      transferType: e.transfer_type,
    }));
  }

  async saveContractTransfers(
    contract: string,
    transfers: Transfer[],
  ): Promise<void> {
    if (!transfers.length) {
      return;
    }
    const entities = transfers.map<TransferEntity>((t) => ({
      amount: BigInt(t.amount),
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
      transfer_type: t.transferType,
    }));
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      let i = 0;
      let type = '';
      for (const entity of entities) {
        i++;
        await this.db.none(
          `INSERT INTO transfer (transaction_hash, amount, block_number, contract, from_party, to_party,
                                           log_index, timestamp, token_id, transaction_index, transfer_type)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE transfer_type = transfer_type`,
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
            entity.transfer_type,
          ],
          { connection },
        );
        type = entity.transfer_type;
      }
      console.log(
        `saved ${i} ${type} type transfers. largest block no: ${
          entities.at(-1)?.block_number
        }`,
      );
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      await connection.end();
    }
  }

  async deleteOsTransfers() {
    this.db.none(`delete from transfer where contract = ?`, [
      '0x495f947276749ce646f68ac8c248420045cb7b5e',
    ]);
  }

  async countOS() {
    const { count } = await this.db.one<{ count: bigint }>(
      `select count(*) as count from transfer where contract = ?`,
      ['0x495f947276749ce646f68ac8c248420045cb7b5e'],
    );
    return { count: bigInt2Number(count) };
  }
}
