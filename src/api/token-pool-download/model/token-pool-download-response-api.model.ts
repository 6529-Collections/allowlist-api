import { ApiProperty } from '@nestjs/swagger';
import { TokenPoolDownloadStatus } from '../../../repository/token-pool-download/token-pool-download-status';

export class TokenPoolDownloadResponseApiModel {
  @ApiProperty({
    description: 'Contract address of the token pool.',
  })
  readonly contract: string;

  @ApiProperty({
    description: 'Token pool token ids, if empty then all.',
  })
  readonly tokenIds?: string;

  @ApiProperty({
    description: 'ID of the token pool.',
  })
  readonly tokenPoolId: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'Block number of the token pool.',
  })
  readonly blockNo: number;

  @ApiProperty({
    description: 'Status of the token pool.',
  })
  readonly status: TokenPoolDownloadStatus;

  @ApiProperty({
    description: 'Consolidate wallets.',
  })
  readonly consolidateWallets: boolean;
}
