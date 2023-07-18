import { ApiProperty } from '@nestjs/swagger';

export class ContractTokenIdsAsStringResponseApiModel {
  @ApiProperty({
    description: 'Token IDs of the contract.',
  })
  readonly tokenIds: string;
}
