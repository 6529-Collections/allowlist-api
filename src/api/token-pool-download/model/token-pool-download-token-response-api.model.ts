import { ApiProperty } from '@nestjs/swagger';

export class TokenPoolDownloadTokenResponseApiModel {
  @ApiProperty({
    description: 'Contract number',
    type: String,
    required: true,
  })
  readonly contract: string;

  @ApiProperty({
    description: 'Token ID',
    type: String,
    required: true,
  })
  readonly tokenId: string;

  @ApiProperty({
    description: 'Amount of tokens',
    type: Number,
    required: true,
  })
  readonly amount: number;

  @ApiProperty({
    description: 'Wallet address',
    type: String,
    required: true,
  })
  readonly wallet: string;
}
