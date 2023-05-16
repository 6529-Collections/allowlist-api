import { Transfer } from '@6529-collections/allowlist-lib/allowlist/state-types/transfer';

export interface TransferPoolTransferDto extends Transfer {
  readonly id: string;
  readonly allowlistId: string;
  readonly transferPoolId: string;
  readonly activeRunId: string;
  readonly order: number;
}
