import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { ApiProperty } from '@nestjs/swagger';

export class AllowlistOperationApiModel implements AllowlistOperation {
  @ApiProperty({ enum: Object.keys(AllowlistOperationCode) })
  readonly code: AllowlistOperationCode;
  @ApiProperty({ type: Object })
  readonly params: any;
}
