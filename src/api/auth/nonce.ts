import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Nonce {
  @ApiProperty({
    description: 'The nonce to be signed with your Web3 wallet',
  })
  readonly nonce: string;
  @ApiProperty({
    description:
      'Same nonce signed with server secret. This needs to be sent back with login request',
  })
  readonly serverSignature: string;
}

export class VerifySignedNonceRequest {
  @ApiProperty({
    description: 'The serverSignature from the getNonce response',
  })
  @IsString()
  readonly serverSignature: string;
  @ApiProperty({
    description: 'Nonce which is signed with your Web3 wallet',
  })
  @IsNotEmpty()
  @IsString()
  readonly clientSignature: string;
}
