import { ApiProperty } from '@nestjs/swagger';
import { WalletPool } from '@6529-collections/allowlist-lib/allowlist/state-types/wallet-pool';

export class WalletPoolResponseApiModel implements Omit<WalletPool, 'wallets'> {
  @ApiProperty({
    description: 'ID',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'Name of the wallet pool.',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the wallet pool.',
  })
  readonly description: string;

  @ApiProperty({
    description: 'Number of wallets in the wallet pool.',
  })
  readonly walletsCount: number;
}
