import { CustomTokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/custom-token-pool';

export interface CustomTokenPoolEntity extends Omit<CustomTokenPool, 'tokens'> {
  readonly id: string;
  readonly allowlist_id: string;
}
