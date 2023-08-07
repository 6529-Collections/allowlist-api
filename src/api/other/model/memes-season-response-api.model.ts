import { ApiProperty } from '@nestjs/swagger';

export class MemesSeasonResponseApiModel {
  @ApiProperty({
    description: 'ID of the memes season.',
    type: Number,
    required: true,
    example: 1,
  })
  readonly season: number;

  @ApiProperty({
    description: 'Range of tokenIds.',
    type: String,
    required: true,
    example: '1-47',
  })
  readonly tokenIds: string;
}
