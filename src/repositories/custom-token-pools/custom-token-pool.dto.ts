import { CustomTokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/custom-token-pool';

export interface CustomTokenPoolDto
  extends Omit<CustomTokenPool, 'id' | 'tokens'> {
  readonly id: string;
  readonly allowlistId: string;
  readonly customTokenPoolId: string;
  readonly activeRunId: string;
}
