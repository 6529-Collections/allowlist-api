import { UseInterceptors } from '@nestjs/common';
import { AllowlistAccessInterceptor } from '../interceptors/allowlist-access.interceptor';

export const HaveAllowlistAccess = () =>
  UseInterceptors(AllowlistAccessInterceptor);
