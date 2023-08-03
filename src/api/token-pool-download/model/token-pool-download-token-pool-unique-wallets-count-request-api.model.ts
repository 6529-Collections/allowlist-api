import { Pool } from '@6529-collections/allowlist-lib/app-types';
import { ApiProperty } from '@nestjs/swagger';

class TokenPoolDownloadTokenPoolUniqueWalletsCountSnapshotRequestApiModel {
  readonly snapshotId: string;
  readonly snapshotType: Pool;
  readonly extraWallets: string[];
}

export class TokenPoolDownloadTokenPoolUniqueWalletsCountRequestApiModel {
  @ApiProperty({
    description: 'Component ids to exclude winners from the count.',
    type: [String],
  })
  readonly excludeComponentWinners: string[];

  @ApiProperty({
    description: 'Snapshots to exclude from the count.',
    type: [TokenPoolDownloadTokenPoolUniqueWalletsCountSnapshotRequestApiModel],
  })
  readonly excludeSnapshots: TokenPoolDownloadTokenPoolUniqueWalletsCountSnapshotRequestApiModel[];

  @ApiProperty({
    description:
      'Extra wallets to add to tokenPool, meant mainly for custom token pools use cases.',
    type: [String],
  })
  readonly extraWallets: string[];
}
