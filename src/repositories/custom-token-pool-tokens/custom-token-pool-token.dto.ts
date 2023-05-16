import { CustomTokenOwnership } from '@6529-collections/allowlist-lib/allowlist/state-types/custom-token-pool';

export interface CustomTokenPoolTokenDto
  extends Omit<CustomTokenOwnership, 'id'> {
  readonly id: string;
  readonly allowlistId: string;
  readonly customTokenPoolId: string;
  readonly activeRunId: string;
  readonly order: number;
  readonly tokenId: string;
}
