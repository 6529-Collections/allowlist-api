import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { SentryService } from './sentry.service';
import * as Sentry from '@sentry/serverless';

@Injectable()
export class SentryApiInterceptor implements NestInterceptor {
  constructor(private sentryService: SentryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!process.env.SENTRY_DSN) {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest();

    const { span } = this.sentryService.getRequestSpan(request, {
      op: `Route Handler`,
    });

    return next.handle().pipe(
      catchError((error) => {
        const skipCapture =
          error instanceof HttpException && error.getStatus() < 500;
        if (!skipCapture) {
          Sentry.captureException(error, span.getTraceContext());
        }
        return throwError(() => error);
      }),
      finalize(async () => {
        span.finish();
      }),
    );
  }
}
