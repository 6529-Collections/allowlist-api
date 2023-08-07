import { TokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/token-pool';

export interface TokenPoolEntity
  extends Omit<
    TokenPool,
    'tokens' | 'tokenIds' | 'transferPoolId' | 'blockNo' | 'consolidateBlockNo'
  > {
  readonly allowlist_id: string;
  readonly token_ids?: string;
  readonly wallets_count: number;
  readonly tokens_count: number;
  readonly block_no: number;
  readonly consolidate_block_no: number;
}
