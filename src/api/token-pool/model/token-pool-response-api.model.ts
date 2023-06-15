import { ApiProperty } from '@nestjs/swagger';
import { TokenPool } from '@6529-collections/allowlist-lib/allowlist/state-types/token-pool';

export class TokenPoolResponseApiModel
  implements Omit<TokenPool, 'tokens' | 'tokenIds' | 'transferPoolId'>
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

  @ApiProperty({
    description: 'Number of wallets in the token pool.',
  })
  readonly walletsCount: number;

  @ApiProperty({
    description: 'Number of tokens in the token pool.',
  })
  readonly tokensCount: number;
}
