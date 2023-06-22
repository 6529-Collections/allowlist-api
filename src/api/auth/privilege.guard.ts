import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Privilege, PRIVILEGE_KEY } from './privileges';

@Injectable()
export class PrivilegeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPrivilege = this.reflector.getAllAndOverride<Privilege>(
      PRIVILEGE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPrivilege) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const { privileges } = request.user;
    return privileges.includes(requiredPrivilege);
  }
}
