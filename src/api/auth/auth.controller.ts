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
    const signingAddress = await this.verifySigningAddress(
      nonce,
      clientSignature,
    );
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

    await this.verifyTdh(signingAddress);
    return signingAddress;
  }

  async verifyTdh(signingAddress: string) {
    const response = await fetch(
      `https://api.seize.io/api/consolidated_owner_metrics/?wallet=${signingAddress}`,
    ).then((res) => res.json());
    const memesBalance = response.data?.at(0)?.memes_balance || 0;
    const memesTdh = response.data?.at(0)?.memes_tdh || 0;
    if (memesBalance < 1 || memesTdh < 1) {
      throw new ForbiddenException(`Wallet doesn't have access to this API`);
    }
  }
}
