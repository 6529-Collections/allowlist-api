import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { ApiProperty } from '@nestjs/swagger';
import { Min } from 'class-validator';

export class AllowlistOperationResponseApiModel implements AllowlistOperation {
  @ApiProperty({ enum: Object.keys(AllowlistOperationCode) })
  readonly code: AllowlistOperationCode;
  @ApiProperty({ type: Object })
  readonly params: any;
  @ApiProperty({ type: Number, minimum: 1 })
  @Min(1)
  readonly order: number;
  @ApiProperty({ type: Boolean })
  readonly hasRan: boolean;
  @ApiProperty({ type: Number })
  readonly createdAt: number;
}
