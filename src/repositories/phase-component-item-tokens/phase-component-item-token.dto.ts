import { AllowlistItemToken } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-item';

export interface PhaseComponentItemTokenDto
  extends Omit<AllowlistItemToken, 'id'> {
  readonly id: string;
  readonly allowlistId: string;
  readonly phaseId: string;
  readonly phaseComponentId: string;
  readonly phaseComponentItemId: string;
  readonly tokenId: string;
  readonly order: number;
  readonly activeRunId: string;
}
