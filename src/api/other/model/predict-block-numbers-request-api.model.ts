import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsNumber } from 'class-validator';

export class PredictBlockNumbersRequestApiModel {
  @ApiProperty({
    example: 1682964091000,
    description: 'Minimum timestamp of the block',
  })
  readonly minTimestamp: number;
  @ApiProperty({
    example: 1685210491000,
    description: 'Maximum timestamp of the block',
  })
  readonly maxTimestamp: number;
  @ApiProperty({
    example: [6529, 69, 420],
    description: 'Block numbers to include in the prediction',
  })
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
    },
    { each: true },
  )
  @ArrayNotEmpty()
  readonly blockNumberIncludes: number[];
}
