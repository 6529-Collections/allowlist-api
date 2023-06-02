import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class AllowlistOperationRequestApiModel implements AllowlistOperation {
  @ApiProperty({
    description: 'Code of the operation.',
    enum: Object.keys(AllowlistOperationCode),
  })
  @IsEnum(AllowlistOperationCode)
  readonly code: AllowlistOperationCode;

  @ApiProperty({
    description: 'Parameters of the operation.',
    type: Object,
  })
  readonly params: any;

  @ApiProperty({
    description: 'Order of the operation in the allowlist.',
    type: Number,
    required: false,
  })
  readonly order?: number;
}
