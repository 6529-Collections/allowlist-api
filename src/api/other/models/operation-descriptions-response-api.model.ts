import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { ApiProperty } from '@nestjs/swagger';

export class OperationDescriptionsResponseApiModel {
  @ApiProperty({
    description: 'Code of the operation.',
  })
  readonly code: AllowlistOperationCode;

  @ApiProperty({
    description: 'Title of the operation.',
  })
  readonly title: string;

  @ApiProperty({
    description: 'Description of the operation.',
  })
  readonly description: string;
}
