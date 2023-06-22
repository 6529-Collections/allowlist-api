import {
  Body,
  Controller,
  ForbiddenException,
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
import { roleToPrivileges } from './privileges';
import { LoginResponse } from './login.response';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EthereumWalletDataReaderService } from './ethereum-wallet-data-reader.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly ethereum: EthereumWalletDataReaderService,
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
    const signingAddress = ethers
      .verifyMessage(nonce, clientSignature)
      ?.toLowerCase();
    if (!signingAddress) {
      throw new UnauthorizedException('Invalid client signature');
    }
    const walletData = await this.ethereum.getWalletData({
      wallet: signingAddress,
    });
    if (!walletData) {
      throw new ForbiddenException(`Wallet doesn't have access to this API`);
    }
    const authToken = this.jwtService.sign(
      {
        id: randomUUID(),
        sub: signingAddress,
        privileges: roleToPrivileges(walletData.role),
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
}
