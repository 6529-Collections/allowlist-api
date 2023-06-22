import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  @ApiProperty({
    description:
      'The authentication token to be used in the Authorization header of subsequent requests',
  })
  readonly token: string;
}
