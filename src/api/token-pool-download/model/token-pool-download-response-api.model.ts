import { ApiProperty } from '@nestjs/swagger';
import { TokenPoolDownloadStatus } from '../../../repository/token-pool-download/token-pool-download-status';
import { TokenPoolDownloadStage } from '../../../repository/token-pool-download/token-pool-download-stage';

export class TokenPoolDownloadResponseApiModel {
  @ApiProperty({
    description: 'Contract address of the token pool.',
  })
  readonly contract: string;

  @ApiProperty({
    description: 'Token pool token ids, if empty then all.',
  })
  readonly tokenIds?: string;

  @ApiProperty({
    description: 'ID of the token pool.',
  })
  readonly tokenPoolId: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'Block number of the token pool.',
  })
  readonly blockNo: number;

  @ApiProperty({
    description: 'Status of the token pool.',
  })
  readonly status: TokenPoolDownloadStatus;

  @ApiProperty({
    description: 'Raw persisted status of the token pool download.',
  })
  readonly rawStatus: TokenPoolDownloadStatus;

  @ApiProperty({
    description: 'Block number of the token pool consolidation.',
  })
  readonly consolidateBlockNo: number | null;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Creation timestamp of the token pool download.',
  })
  readonly createdAt?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Last update timestamp of the token pool download.',
  })
  readonly updatedAt?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Claim timestamp of the token pool download.',
  })
  readonly claimedAt?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Last heartbeat timestamp of the token pool download.',
  })
  readonly lastHeartbeatAt?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Completion timestamp of the token pool download.',
  })
  readonly completedAt?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Failure timestamp of the token pool download.',
  })
  readonly failedAt?: number;

  @ApiProperty({
    required: false,
    enum: TokenPoolDownloadStage,
    description: 'Current execution stage of the token pool download.',
  })
  readonly stage?: TokenPoolDownloadStage;

  @ApiProperty({
    required: false,
    type: Object,
    description: 'Latest persisted progress details for the token pool download.',
  })
  readonly progress?: Record<string, unknown>;

  @ApiProperty({
    description: 'How many times the token pool download has been claimed.',
  })
  readonly attemptCount: number;

  @ApiProperty({
    description: 'How many times the snapshot has failed before.',
  })
  readonly failureCount: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Timestamp of the previous failure recorded for this snapshot.',
  })
  readonly lastFailureAt?: number;

  @ApiProperty({
    required: false,
    description: 'Reason for the previous failure recorded for this snapshot.',
  })
  readonly lastFailureReason?: string | null;

  @ApiProperty({
    description: 'Whether the API considers the job stale.',
  })
  readonly stale: boolean;

  @ApiProperty({
    required: false,
    description: 'Failure or stale-state reason for the token pool download.',
  })
  readonly errorReason?: string | null;

  @ApiProperty({
    description: 'Whether the UI may offer an in-place retry for this snapshot.',
  })
  readonly retryable: boolean;
}
