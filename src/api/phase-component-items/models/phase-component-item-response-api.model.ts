import { ApiProperty } from '@nestjs/swagger';
import { PhaseComponentItemDto } from '../../../repositories/phase-component-items/phase-component-item.dto';

export class PhaseComponentItemResponseApiModel
  implements PhaseComponentItemDto
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
    description: 'ID of the phase component.',
  })
  readonly phaseComponentId: string;

  @ApiProperty({
    description: 'ID of the phase component item.',
  })
  readonly phaseComponentItemId: string;

  @ApiProperty({
    description: 'ID of the active run.',
  })
  readonly activeRunId: string;

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
}
