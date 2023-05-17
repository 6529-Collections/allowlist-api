import { ApiProperty } from '@nestjs/swagger';
import { TransferPoolDto } from '../../../repositories/transfer-pools/transfer-pool.dto';

export class TransferPoolResponseApiModel implements TransferPoolDto {
  @ApiProperty({
    description: 'ID',
  })
  readonly id: string;

  @ApiProperty({
    description: 'ID of the allowlist.',
  })
  readonly allowlistId: string;

  @ApiProperty({
    description: 'ID of the transfer pool.',
  })
  readonly transferPoolId: string;

  @ApiProperty({
    description: 'ID of the active run.',
  })
  readonly activeRunId: string;

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
}
