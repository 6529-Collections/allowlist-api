import { ApiProperty } from '@nestjs/swagger';
import { Pool } from '@6529-collections/allowlist-lib/app-types';
import { AllowlistItem } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-item';

export class PhaseComponentItemResponseApiModel
  implements Omit<AllowlistItem, 'tokens' | '_insertionOrder'>
{
  @ApiProperty({
    description: 'Contract address.',
  })
  contract: string;
  @ApiProperty({
    description: 'Block number.',
  })
  blockNo: number;
  @ApiProperty({
    description: 'Consolidate block number.',
  })
  consolidateBlockNo: number | null;
  @ApiProperty({
    description: 'ID',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'ID of the phase.',
  })
  readonly phaseId: string;

  @ApiProperty({
    description: 'ID of the phase component.',
  })
  readonly phaseComponentId: string;

  @ApiProperty({
    description: 'Insertion order.',
  })
  readonly insertionOrder: number;

  @ApiProperty({
    description: 'Name of the component item.',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the component item.',
  })
  readonly description: string;

  @ApiProperty({
    description: 'ID of the pool.',
  })
  readonly poolId: string;

  @ApiProperty({
    description: 'Type of the pool.',
    enum: Pool,
  })
  readonly poolType: Pool;

  @ApiProperty({
    description: 'Number of wallets in the component.',
  })
  readonly walletsCount: number;

  @ApiProperty({
    description: 'Number of tokens in the component.',
  })
  readonly tokensCount: number;
}
