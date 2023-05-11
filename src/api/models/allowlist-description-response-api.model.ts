import { ApiProperty } from '@nestjs/swagger';
import { DescribableEntity } from '@6529-collections/allowlist-lib/allowlist/state-types/describable-entity';

export class AllowlistDescriptionResponseApiModel implements DescribableEntity {
  @ApiProperty({
    description:
      'ID of the allowlist. ID must be unique across all allowlists and over all this allowlist operations',
    minLength: 1,
    maxLength: 250,
    pattern: '^[a-zA-Z0-9_-]+$',
  })
  readonly id: string;

  @ApiProperty({
    description: 'Name of the allowlist',
    minLength: 1,
    maxLength: 250,
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the allowlist',
    minLength: 1,
    maxLength: 1000,
  })
  readonly description: string;

  @ApiProperty({ type: Number })
  readonly createdAt: number;

  @ApiProperty({ required: false, type: Object })
  readonly activeRun?: { id: string; createdAt: number };
}