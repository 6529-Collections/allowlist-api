import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { AUTH_CONFIG, AuthConfig } from './auth.config';
import { AuthenticatedUser } from './authenticated-user';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(AUTH_CONFIG) authConfig: AuthConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromUrlQueryParameter('jwt'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: authConfig.authTokenSecret,
    });
  }

  // This is the method that is called when a request is made to a protected route.
  // Don't delete it even if it looks like it's not used.
  async validate(payload: any): Promise<AuthenticatedUser> {
    const wallet = payload.sub;
    return {
      wallet,
    };
  }
}
