export interface TokenPoolDownloaderParamsConfig {
  readonly contract: string;
  readonly tokenIds?: string;
  readonly tokenPoolId: string;
  readonly allowlistId: string;
  readonly blockNo: number;
  readonly consolidateBlockNo: number | null;
}

export interface TokenPoolDownloaderParamsStateStartingBlocks {
  readonly single: number | null;
  readonly batch: number | null;
}

export interface TokenPoolDownloaderParamsState {
  runsCount: number;
  readonly startingBlocks: TokenPoolDownloaderParamsStateStartingBlocks[];
}

export interface TokenPoolDownloaderParams {
  readonly config: TokenPoolDownloaderParamsConfig;
  readonly state: TokenPoolDownloaderParamsState;
}
