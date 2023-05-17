import { ApiProperty } from '@nestjs/swagger';
import {
  AllowlistRunDto,
  AllowlistRunStatus,
} from '../../../repositories/allowlist-runs/allowlist-runs.dto';

export class AllowlistRunResponseApiModel implements AllowlistRunDto {
  @ApiProperty({
    description: 'ID of the allowlist run.',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'Status of the allowlist run.',
    enum: Object.values(AllowlistRunStatus),
  })
  readonly status: AllowlistRunStatus;

  @ApiProperty({
    description: 'Timestamp of the allowlist run creation.',
  })
  readonly createdAt: number;

  @ApiProperty({
    description: 'Timestamp of the allowlist run claim.',
    required: false,
  })
  readonly claimedAt?: number;
}
