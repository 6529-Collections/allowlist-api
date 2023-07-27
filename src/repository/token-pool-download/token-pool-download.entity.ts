import { TokenPoolDownloadStatus } from './token-pool-download-status';

export interface TokenPoolDownloadEntity {
  readonly contract: string;
  readonly token_ids?: string;
  readonly token_pool_id: string;
  readonly allowlist_id: string;
  readonly block_no: number;
  readonly consolidate_wallets: number;
  readonly status: TokenPoolDownloadStatus;
}
