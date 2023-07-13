import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SearchContractMetadataRequestApiModel {
  @ApiProperty({
    description: 'Keyword to search for',
    minLength: 1,
    maxLength: 250,
  })
  @IsString()
  readonly keyword: string;
}
