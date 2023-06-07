import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';

export interface AllowlistOperationEntity extends AllowlistOperation {
  readonly id: string;
  readonly created_at: bigint;
  readonly op_order: number;
  readonly allowlist_id: string;
  readonly has_ran: boolean;
}
