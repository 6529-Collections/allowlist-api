import { AllowlistItem } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-item';

export interface PhaseComponentItemDto
  extends Omit<AllowlistItem, 'tokens' | 'id' | '_insertionOrder'> {
  readonly id: string;
  readonly allowlistId: string;
  readonly phaseId: string;
  readonly phaseComponentId: string;
  readonly phaseComponentItemId: string;
  readonly activeRunId: string;
  readonly insertionOrder: number;
}
