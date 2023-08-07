import { AllowlistItem } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-item';

export interface PhaseComponentItemEntity
  extends Omit<
    AllowlistItem,
    | 'tokens'
    | '_insertionOrder'
    | 'poolId'
    | 'poolType'
    | 'blockNo'
    | 'consolidateBlockNo'
  > {
  readonly allowlist_id: string;
  readonly phase_id: string;
  readonly phase_component_id: string;
  readonly insertion_order: number;
  readonly pool_id: string;
  readonly pool_type: string;
  readonly wallets_count: number;
  readonly tokens_count: number;
  readonly block_no: number;
  readonly consolidate_block_no: number;
}
