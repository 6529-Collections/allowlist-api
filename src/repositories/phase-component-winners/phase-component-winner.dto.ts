export interface PhaseComponentWinnerDto {
  readonly id: string;
  readonly allowlistId: string;
  readonly phaseId: string;
  readonly componentId: string;
  readonly activeRunId: string;
  readonly wallet: string;
  readonly amount: number;
}
