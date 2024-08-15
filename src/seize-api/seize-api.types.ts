export interface SeizeApiSeizeSeasonResponse {
  readonly season: number;
  readonly count: number;
  readonly token_ids: string;
}

export interface SeizeAPIWalletConsolidatedMetricsResponse {
  count: number;
  page: number;
  next: null;
  data: SeizeAPIWalletConsolidatedMetrics[];
}

export interface SeizeAPIWalletConsolidatedMetrics {
  readonly consolidation_key: string;
  readonly balance: number;
  readonly unique_memes: number;
  readonly memes_cards_sets: number;
  readonly handle: string | null;
  readonly pfp_url: string | null;
  readonly rep_score: number;
  readonly cic_score: number;
  readonly primary_wallet: string;
  readonly consolidation_display: string;
  readonly boosted_tdh: number;
  readonly level: number;
  readonly day_change: number;
  readonly unique_memes_total: number;
}

export interface SeizeAPIWalletConsolidatedMetricsMeme {
  id: number;
  tdh: number;
  balance: number;
  tdh__raw: number;
}

export interface SeizeAPIWalletConsolidatedMetricsMemesRank {
  id: number;
  rank: number;
}
