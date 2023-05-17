import { ApiProperty } from '@nestjs/swagger';
import { PhaseComponentDto } from '../../../repositories/phase-components/phase-component.dto';

export class PhaseComponentResponseApiModel implements PhaseComponentDto {
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
    description: 'ID of the component.',
  })
  readonly componentId: string;

  @ApiProperty({
    description: 'ID of the active run.',
  })
  readonly activeRunId: string;

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
}
