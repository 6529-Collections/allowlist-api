import { WalletPool } from '@6529-collections/allowlist-lib/allowlist/state-types/wallet-pool';

export interface WalletPoolEntity extends Omit<WalletPool, 'wallets'> {
  readonly allowlist_id: string;
}
