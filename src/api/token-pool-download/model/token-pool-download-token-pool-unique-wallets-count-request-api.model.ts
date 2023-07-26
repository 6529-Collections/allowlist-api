import { ApiProperty } from '@nestjs/swagger';

export class TokenPoolDownloadTokenPoolUniqueWalletsCountRequestApiModel {
  @ApiProperty({
    description: 'Component ids to exclude winners from the count.',
    type: [String],
  })
  readonly excludeComponentWinners: string[];

  @ApiProperty({
    description:
      'Extra wallets to add to tokenPool, meant mainly for custom token pools use cases.',
    type: [String],
  })
  readonly extraWallets: string[];
}
