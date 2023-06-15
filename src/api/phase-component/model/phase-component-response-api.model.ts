import { ApiProperty } from '@nestjs/swagger';
import { AllowlistComponent } from '@6529-collections/allowlist-lib/allowlist/state-types/allowlist-component';

export class PhaseComponentResponseApiModel
  implements Omit<AllowlistComponent, 'items' | 'winners' | '_insertionOrder'>
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
    description: 'ID of the phase.',
  })
  readonly phaseId: string;

  @ApiProperty({
    description: 'Insertion order.',
  })
  readonly insertionOrder: number;

  @ApiProperty({
    description: 'Name of the component.',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the component.',
  })
  readonly description: string;

  @ApiProperty({
    description: 'Number of wallets in the component.',
  })
  readonly walletsCount: number;

  @ApiProperty({
    description: 'Number of tokens in the component.',
  })
  readonly tokensCount: number;
}
