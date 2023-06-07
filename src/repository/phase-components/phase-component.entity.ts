import { AllowlistComponent } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-component';

export interface PhaseComponentEntity
  extends Omit<AllowlistComponent, 'items' | 'winners' | '_insertionOrder'> {
  readonly allowlist_id: string;
  readonly phase_id: string;
  readonly insertion_order: number;
}
