import { TokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/token-pool';

export interface TokenPoolDto extends Omit<TokenPool, 'tokens' | 'id'> {
  readonly id: string;
  readonly allowlistId: string;
  readonly tokenPoolId: string;
  readonly activeRunId: string;
}
