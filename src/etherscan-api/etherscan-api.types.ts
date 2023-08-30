export interface EtherscanGetBlockCountdownResponse {
  readonly status?: string | null; // '1' === OK, '0' === ERROR;
  readonly message?: string | null; // 'OK' === OK, 'NOTOK' === ERROR;
  readonly result?: {
    CurrentBlock: string | null; // Current block number
    CountdownBlock: string | null; // Target block number
    RemainingBlock: string | null; // Remaining blocks
    EstimateTimeInSec: string | null; // Estimate time in seconds to reach target block number
  } | null;
}
