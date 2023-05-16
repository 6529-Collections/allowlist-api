import { AllowlistComponent } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-component';

export interface PhaseComponentDto
  extends Omit<
    AllowlistComponent,
    'id' | 'items' | 'winners' | '_insertionOrder'
  > {
  readonly id: string;
  readonly allowlistId: string;
  readonly phaseId: string;
  readonly activeRunId: string;
  readonly componentId: string;
  readonly insertionOrder: number;
}
