import { DescribableEntity } from '@6529-collections/allowlist-lib/allowlist/state-types/describable-entity';

export interface AllowlistEntity extends DescribableEntity {
  readonly id: string;
  readonly created_at: bigint;
  readonly run_status?: string;
  readonly run_created_at?: bigint;
  readonly run_updated_at?: bigint;
}
