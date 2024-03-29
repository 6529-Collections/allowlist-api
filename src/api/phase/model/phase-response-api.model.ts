import { ApiProperty } from '@nestjs/swagger';
import { AllowlistPhase } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-phase';

export class PhaseResponseApiModel
  implements Omit<AllowlistPhase, 'components' | '_insertionOrder'>
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
    description: 'Name of the phase.',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the phase.',
  })
  readonly description: string;

  @ApiProperty({
    description: 'Insertion order of the phase.',
  })
  readonly insertionOrder: number;

  @ApiProperty({
    description: 'Number of wallets in the phase.',
  })
  readonly walletsCount: number;

  @ApiProperty({
    description: 'Number of tokens in the phase.',
  })
  readonly tokensCount: number;

  @ApiProperty({
    description: 'Number of winners wallets in the phase.',
  })
  readonly winnersWalletsCount: number;

  @ApiProperty({
    description: 'Number of winners spots in the phase.',
  })
  readonly winnersSpotsCount: number;
}
