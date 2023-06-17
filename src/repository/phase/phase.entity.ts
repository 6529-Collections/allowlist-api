import { AllowlistPhase } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-phase';

export interface PhaseEntity
  extends Omit<AllowlistPhase, 'components' | '_insertionOrder'> {
  readonly allowlist_id: string;
  readonly insertion_order: number;
  readonly wallets_count: number;
  readonly tokens_count: number;
  readonly winners_wallets_count: number;
  readonly winners_spots_count: number;
}
