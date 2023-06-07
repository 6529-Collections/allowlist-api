import { TransferPool } from '@6529-collections/allowlist-lib/allowlist/operations/get-collection-transfers/get-collection-transfers-operation.types';

export interface TransferPoolEntity
  extends Omit<TransferPool, 'transfers' | 'blockNo'> {
  readonly allowlist_id: string;
  readonly block_no: number;
}
