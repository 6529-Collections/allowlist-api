import { SetMetadata } from '@nestjs/common';

export function roleToPrivileges(role: number): Privilege[] {
  switch (role) {
    case 1:
      return [Privilege.EXAMPLE_PRIVILEGE];
    default:
      return [];
  }
}

export enum Privilege {
  EXAMPLE_PRIVILEGE = 'EXAMPLE_PRIVILEGE',
}

export const PRIVILEGE_KEY = 'privilege';

export const HasPrivilege = (role: Privilege) =>
  SetMetadata(PRIVILEGE_KEY, role);
