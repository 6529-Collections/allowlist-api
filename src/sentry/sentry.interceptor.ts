import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { SentryService } from './sentry.service';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name);
  private sentryInitialized = false;

  constructor(
    private sentryService: SentryService,
    private configService: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const sentryDsn = this.configService.get('ALLOWLIST_SENTRY_DSN');
    if (sentryDsn && !this.sentryInitialized) {
      Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 1.0,
      });
      this.sentryInitialized = true;
    }
    const request = context.switchToHttp().getRequest();
    if (!this.sentryInitialized) {
      this.logger.warn(
        'Sentry not initialized. Set env variable SENTRY_DSN to initialize',
      );
      return next.handle();
    }

    const span = this.sentryService.getRequestSpan(request, {
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
      finalize(() => {
        span.finish();
      }),
    );
  }
}
