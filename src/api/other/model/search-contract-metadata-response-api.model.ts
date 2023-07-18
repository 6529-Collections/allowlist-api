import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchContractMetadataResponseApiModel {
  @ApiProperty({
    description: 'ID of the contract',
  })
  @IsString()
  readonly id: string;

  @ApiProperty({
    description: 'Address of the contract',
  })
  @IsString()
  readonly address: string;

  @ApiProperty({
    description: 'Name of the contract',
  })
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: 'Type of the contract',
  })
  @IsString()
  readonly tokenType: string;

  @ApiProperty({
    description: 'Floor price of the contract',
  })
  @IsOptional()
  @IsNumber()
  readonly floorPrice: number | null;

  @ApiProperty({
    description: 'Image URL of the contract',
  })
  @IsOptional()
  @IsString()
  readonly imageUrl: string | null;

  @ApiProperty({
    description: 'Description of the contract',
  })
  @IsOptional()
  @IsString()
  readonly description: string | null;

  @ApiProperty({
    description: 'Total volume of the contract',
  })
  @IsOptional()
  @IsNumber()
  readonly allTimeVolume: number | null;

  @ApiProperty({
    description: 'Is the contract verified on OpenSea',
  })
  @IsBoolean()
  readonly openseaVerified: boolean;
}
