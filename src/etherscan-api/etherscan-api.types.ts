export interface EtherscanGetBlockCountdownResponse {
  readonly status?: string | null; // '1' === OK, '0' === ERROR;
  readonly message?: string | null; // 'OK' === OK, 'NOTOK' === ERROR;
  readonly result?: EtherscanBlockCountdownResult | string | null;
}

export interface EtherscanBlockCountdownResult {
  readonly CurrentBlock: string | null; // Current block number
  readonly CountdownBlock: string | null; // Target block number
  readonly RemainingBlock: string | null; // Remaining blocks
  readonly EstimateTimeInSec: string | null; // Estimated seconds to target
}
