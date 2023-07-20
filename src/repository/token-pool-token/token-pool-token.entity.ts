export interface TokenPoolTokenEntity {
  readonly id: string;
  readonly contract: string;
  readonly token_id: string;
  readonly amount: number;
  readonly wallet: string;
  readonly token_pool_id: string;
  readonly allowlist_id: string;
}
