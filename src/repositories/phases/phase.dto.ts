import { AllowlistPhase } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-phase';

export interface PhaseDto
  extends Omit<AllowlistPhase, 'components' | 'id' | '_insertionOrder'> {
  readonly id: string;
  readonly allowlistId: string;
  readonly activeRunId: string;
  readonly phaseId: string;
  readonly name: string;
  readonly description: string;
  readonly insertionOrder: number;
}
