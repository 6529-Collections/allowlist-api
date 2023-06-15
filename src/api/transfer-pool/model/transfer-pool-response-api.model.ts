import { ApiProperty } from '@nestjs/swagger';
import { TransferPool } from '@6529-collections/allowlist-lib/allowlist/operations/get-collection-transfers/get-collection-transfers-operation.types';

export class TransferPoolResponseApiModel
  implements Omit<TransferPool, 'transfers'>
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
    description: 'Name of the transfer pool.',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Description of the transfer pool.',
  })
  readonly description: string;

  @ApiProperty({
    description: 'Contract of the transfer pool.',
  })
  readonly contract: string;

  @ApiProperty({
    description: 'Block number of the transfer pool.',
  })
  readonly blockNo: number;

  @ApiProperty({
    description: 'Number of transfers in the transfer pool.',
  })
  readonly transfersCount: number;
}
