import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';

export interface AllowlistOperationDto extends AllowlistOperation {
  readonly id: string;
  readonly createdAt: number;
  readonly order: number;
  readonly activeRunId?: string;
  readonly allowlistId: string;
}
