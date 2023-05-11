import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class AllowlistOperationRequestApiModel implements AllowlistOperation {
  @ApiProperty({ enum: Object.keys(AllowlistOperationCode) })
  @IsEnum(AllowlistOperationCode)
  readonly code: AllowlistOperationCode;
  @ApiProperty({ type: Object })
  readonly params: any;
  @ApiProperty({ type: Number })
  readonly order: number;
}
