import { DescribableEntity } from '@6529-collections/allowlist-lib/allowlist/state-types/describable-entity';

export interface AllowlistDto extends DescribableEntity {
  readonly id: string;
  readonly createdAt: number;
  readonly activeRun?: { id: string; createdAt: number };
}
