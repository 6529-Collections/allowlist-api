import { TokenPoolDownloadStatus } from './token-pool-download-status';
import { TokenPoolDownloadStage } from './token-pool-download-stage';

export interface TokenPoolDownloadEntity {
  readonly contract: string;
  readonly token_ids?: string;
  readonly token_pool_id: string;
  readonly allowlist_id: string;
  readonly block_no: number;
  readonly consolidate_block_no: number | null;
  readonly status: TokenPoolDownloadStatus;
  readonly created_at?: bigint;
  readonly updated_at?: bigint;
  readonly claimed_at?: bigint;
  readonly last_heartbeat_at?: bigint;
  readonly completed_at?: bigint;
  readonly failed_at?: bigint;
  readonly error_reason?: string | null;
  readonly failure_count?: number;
  readonly last_failure_at?: bigint;
  readonly last_failure_reason?: string | null;
  readonly attempt_count?: number;
  readonly stage?: TokenPoolDownloadStage | null;
  readonly progress?: string | null;
}
