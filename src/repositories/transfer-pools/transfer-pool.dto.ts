import { TransferPool } from '@6529-collections/allowlist-lib/allowlist/operations/get-collection-transfers/get-collection-transfers-operation.types';

export interface TransferPoolDto
  extends Omit<TransferPool, 'transfers' | 'id'> {
  readonly id: string;
  readonly allowlistId: string;
  readonly transferPoolId: string;
  readonly activeRunId: string;
}
