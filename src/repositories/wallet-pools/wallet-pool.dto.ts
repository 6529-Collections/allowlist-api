import { WalletPool } from '@6529-collections/allowlist-lib/allowlist/state-types/wallet-pool';

export interface WalletPoolDto extends Omit<WalletPool, 'id' | 'wallets'> {
  readonly id: string;
  readonly allowlistId: string;
  readonly walletPoolId: string;
  readonly activeRunId: string;
}
