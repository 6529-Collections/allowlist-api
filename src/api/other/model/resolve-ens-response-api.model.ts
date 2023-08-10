import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResolveEnsResponseApiModel {
  @ApiProperty({
    description: 'ENS name',
    example: 'myname.eth',
    minLength: 4,
  })
  @IsString()
  readonly ens: string;

  @ApiProperty({
    description: 'Address',
    example: '0x1234567890123456789012345678901234567890',
    minLength: 42,
    maxLength: 42,
  })
  readonly address: string;
}
