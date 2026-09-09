import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import * as Sentry from '@sentry/aws-serverless';

@Injectable()
export class SentryApiInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!process.env.SENTRY_DSN) {
      return next.handle();
    }
    return next.handle().pipe(
      catchError((error) => {
        const skipCapture =
          error instanceof HttpException && error.getStatus() < 500;
        if (!skipCapture) {
          Sentry.captureException(error);
        }
        return throwError(() => error);
      }),
    );
  }
}
