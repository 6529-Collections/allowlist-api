import { ApiProperty } from '@nestjs/swagger';
import { CustomTokenPoolDto } from '../../../repositories/custom-token-pools/custom-token-pool.dto';

export class CustomTokenPoolResponseApiModel implements CustomTokenPoolDto {
  @ApiProperty({
    description: 'ID',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'ID of the custom token pool.',
  })
  readonly customTokenPoolId: string;

  @ApiProperty({
    description: 'ID of the active run.',
  })
  readonly activeRunId: string;

  @ApiProperty({
    description: 'Name of the custom token pool.',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the custom token pool.',
  })
  readonly description: string;
}
