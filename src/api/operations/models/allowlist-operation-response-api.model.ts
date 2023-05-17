import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { ApiProperty } from '@nestjs/swagger';
import { Min } from 'class-validator';
import { AllowlistOperationDto } from '../../../repositories/allowlist-operations/allowlist-operation.dto';

export class AllowlistOperationResponseApiModel
  implements AllowlistOperationDto
{
  @ApiProperty({
    description: 'ID of the allowlist operation.',
  })
  readonly id: string;

  @ApiProperty({
    description: 'Timestamp of the allowlist operation creation.',
  })
  readonly createdAt: number;

  @ApiProperty({
    description: 'Order of the allowlist operation.',
  })
  readonly order: number;

  @ApiProperty({
    description: 'Last run ID of the allowlist operation.',
    required: false,
  })
  readonly activeRunId?: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'Code of the allowlist operation.',
    enum: Object.values(AllowlistOperationCode),
  })
  readonly code: AllowlistOperationCode;

  @ApiProperty({
    description: 'Params of the allowlist operation.',
  })
  readonly params: any;
}
