import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { PublicEndpoint } from './public-endpoint-decorator';
import { JwtService } from '@nestjs/jwt';
import { Nonce, VerifySignedNonceRequest } from './nonce';
import { ethers } from 'ethers';
import { randomUUID } from 'crypto';
import { AUTH_CONFIG, AuthConfig } from './auth.config';
import { LoginResponse } from './login.response';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
  ) {}

  @ApiOperation({
    summary:
      'Get the nonce from server which you should sign with your Web3 wallet',
  })
  @ApiOkResponse({ type: Nonce })
  @PublicEndpoint()
  @Get('nonce')
  getNonce(): Nonce {
    const nonce = randomUUID();
    const serverSignature = this.jwtService.sign(nonce, {
      secret: this.authConfig.authTokenSecret,
    });
    return { nonce, serverSignature };
  }

  @ApiOperation({
    summary:
      'Get an authentication token to be used in the Authorization header of subsequent requests',
  })
  @ApiOkResponse({ type: LoginResponse })
  @PublicEndpoint()
  @Post('login')
  async verifySignedNonceAndCreateAuthToken(
    @Body() request: VerifySignedNonceRequest,
  ): Promise<LoginResponse> {
    const { serverSignature, clientSignature } = request;
    const nonce = this.jwtService.verify(serverSignature, {
      secret: this.authConfig.authTokenSecret,
    });
    const signingAddress = await this.verifySigningAddress(
      nonce,
      clientSignature,
    );
    const authToken = this.jwtService.sign(
      {
        id: randomUUID(),
        sub: signingAddress,
      },
      {
        secret: this.authConfig.authTokenSecret,
        expiresIn: `${this.authConfig.authTokenExpiry.toSeconds()}s`,
      },
    );
    return {
      token: authToken,
    };
  }

  private async verifySigningAddress(
    nonce,
    clientSignature: string,
  ): Promise<string> {
    let signingAddress: string;
    try {
      signingAddress = ethers
        .verifyMessage(nonce, clientSignature)
        ?.toLowerCase();
      if (!signingAddress) {
        throw new Error('Invalid client signature');
      }
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException('Invalid client signature');
    }
    return signingAddress;
  }
}
