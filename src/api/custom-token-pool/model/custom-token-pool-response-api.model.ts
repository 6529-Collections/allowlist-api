import { ApiProperty } from '@nestjs/swagger';
import { CustomTokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/custom-token-pool';

export class CustomTokenPoolResponseApiModel
  implements Omit<CustomTokenPool, 'tokens'>
{
  @ApiProperty({
    description: 'ID',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'Name of the custom token pool.',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the custom token pool.',
  })
  readonly description: string;
}
