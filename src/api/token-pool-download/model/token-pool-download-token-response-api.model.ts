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
  readonly token_id: string;

  @ApiProperty({
    description: 'Amount of tokens',
    type: Number,
    required: true,
  })
  readonly balance: number;

  @ApiProperty({
    description: 'Wallet address',
    type: String,
    required: true,
  })
  readonly address: string;
}
