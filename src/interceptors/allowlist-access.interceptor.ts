import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AllowlistUserRepository } from '../repository/allowlist-user/allowlist-user.repository';

@Injectable()
export class AllowlistAccessInterceptor implements NestInterceptor {
  constructor(
    private readonly allowlistUserRepository: AllowlistUserRepository,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const userWallet = request.user?.wallet;
    const allowlistId = request.params.allowlistId;

    if (!userWallet) {
      throw new UnauthorizedException('User wallet not found');
    }

    const hasAccess = await this.allowlistUserRepository.haveAllowlist({
      allowlistId,
      userWallet,
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        'User does not have access to this allowlist',
      );
    }

    return next.handle().pipe(
      map((data) => {
        return data;
      }),
    );
  }
}
