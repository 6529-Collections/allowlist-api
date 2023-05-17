import { ApiProperty } from '@nestjs/swagger';
import { PhaseDto } from '../../../repositories/phases/phase.dto';

export class PhaseResponseApiModel implements PhaseDto {
  @ApiProperty({
    description: 'ID',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'ID of the active run.',
  })
  readonly activeRunId: string;

  @ApiProperty({
    description: 'ID of the phase.',
  })
  readonly phaseId: string;

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
}
