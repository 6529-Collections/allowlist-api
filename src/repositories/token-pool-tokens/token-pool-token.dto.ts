import { TokenOwnership } from '@6529-collections/allowlist-lib/allowlist/state-types/token-ownership';

export interface TokenPoolTokenDto extends Omit<TokenOwnership, 'id'> {
  readonly id: string;
  readonly allowlistId: string;
  readonly tokenPoolId: string;
  readonly activeRunId: string;
  readonly order: number;
  readonly tokenId: string;
}
