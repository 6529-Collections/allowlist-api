import { TokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/token-pool';

export interface TokenPoolEntity
  extends Omit<TokenPool, 'tokens' | 'tokenIds' | 'transferPoolId'> {
  readonly allowlist_id: string;
  readonly token_ids?: string;
  readonly transfer_pool_id: string;
  readonly wallets_count: number;
  readonly tokens_count: number;
}
