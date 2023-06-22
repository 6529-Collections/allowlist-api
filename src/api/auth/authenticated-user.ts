import { Privilege } from './privileges';

export interface AuthenticatedUser {
  readonly wallet: string;
  readonly tokenId: string;
  readonly privileges: Privilege[];
}
