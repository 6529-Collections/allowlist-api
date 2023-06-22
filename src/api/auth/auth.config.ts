import { Time } from '../../time';

export const AUTH_CONFIG = 'AUTH_CONFIG';

export interface AuthConfig {
  authTokenSecret: string;
  refreshTokenSecret: string;
  authTokenExpiry: Time;
  refreshTokenExpiry: Time;
}
