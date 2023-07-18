import { Transfer } from '@6529-collections/allowlist-lib/allowlist/state-types/transfer';

export interface TransferEntity
  extends Omit<
    Transfer,
    | 'amount'
    | 'logIndex'
    | 'timeStamp'
    | 'tokenID'
    | 'transactionHash'
    | 'transactionIndex'
    | 'to'
    | 'from'
  > {
  readonly amount: bigint;
  readonly block_number: number;
  readonly contract: string;
  readonly from_party: string;
  readonly log_index: number;
  readonly time_stamp: bigint;
  readonly to_party: string;
  readonly token_id: string;
  readonly transaction_hash: string;
  readonly transaction_index: number;
}
