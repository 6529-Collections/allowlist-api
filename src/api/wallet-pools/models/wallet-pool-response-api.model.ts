import { ApiProperty } from '@nestjs/swagger';
import { WalletPoolDto } from '../../../repositories/wallet-pools/wallet-pool.dto';

export class WalletPoolResponseApiModel implements WalletPoolDto {
  @ApiProperty({
    description: 'ID',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'ID of the wallet pool.',
  })
  readonly walletPoolId: string;

  @ApiProperty({
    description: 'ID of the active run.',
  })
  readonly activeRunId: string;

  @ApiProperty({
    description: 'Name of the wallet pool.',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the wallet pool.',
  })
  readonly description: string;
}
