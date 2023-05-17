import { ApiProperty } from '@nestjs/swagger';
import { TokenPoolDto } from '../../../repositories/token-pools/token-pool.dto';

export class TokenPoolResponseApiModel implements TokenPoolDto {
  @ApiProperty({
    description: 'ID',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'ID of the token pool.',
  })
  readonly tokenPoolId: string;

  @ApiProperty({
    description: 'ID of the active run.',
  })
  readonly activeRunId: string;

  @ApiProperty({
    description: 'ID of the transfer pool.',
  })
  readonly transferPoolId: string;

  @ApiProperty({
    description: 'Token pool token ids, if empty then all.',
  })
  readonly tokenIds?: string;

  @ApiProperty({
    description: 'Name of the token pool.',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the token pool.',
  })
  readonly description: string;
}
