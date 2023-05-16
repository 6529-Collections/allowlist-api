export enum AllowlistRunStatus {
  PENDING = 'PENDING',
  CLAIMED = 'CLAIMED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface AllowlistRunDto {
  readonly id: string;
  readonly allowlistId: string;
  readonly createdAt: number;
  readonly claimedAt?: number;
  readonly status: AllowlistRunStatus;
}
