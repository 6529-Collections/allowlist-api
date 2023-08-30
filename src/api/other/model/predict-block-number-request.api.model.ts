import { ApiProperty } from '@nestjs/swagger';

export class PredictBlockNumberRequestApiModel {
  @ApiProperty({
    example: 1682689446000,
    description: 'Timestamp of the block',
  })
  readonly timestamp: number;
}
