import { ApiProperty } from '@nestjs/swagger';

export class ResultResponseApiModel {
  @ApiProperty({
    description: 'ID',
  })
  readonly id: string;

  @ApiProperty({
    description: 'Wallet address',
  })
  readonly wallet: string;

  @ApiProperty({
    description: 'ID of the phase',
  })
  readonly phaseId: string;

  @ApiProperty({
    description: 'ID of the allowlist',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'ID of the phase component',
  })
  readonly phaseComponentId: string;

  @ApiProperty({
    description: 'Amount of spots for the wallet',
  })
  readonly amount: number;
}
