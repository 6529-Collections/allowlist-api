import { ApiProperty } from '@nestjs/swagger';
import { DescribableEntity } from '@6529-collections/allowlist-lib/allowlist/state-types/describable-entity';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AllowlistDescriptionRequestApiModel
  implements Omit<DescribableEntity, 'id'>
{
  @ApiProperty({
    description: 'Name of the allowlist',
    minLength: 1,
    maxLength: 250,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  readonly name: string;

  @ApiProperty({
    description: 'Description of the allowlist',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  readonly description: string;
}
