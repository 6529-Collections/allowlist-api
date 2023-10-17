import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/serverless';
import { Span, SpanContext } from '@sentry/types';

@Injectable()
export class SentryService {
  get span(): Span {
    return Sentry.getCurrentHub().getScope().getSpan();
  }

  public getRequestSpan(request: Request, spanContext: SpanContext) {
    const { method, headers, url } = request;

    const transaction = Sentry.startTransaction({
      name: `Route: ${method} ${url}`,
      op: 'transaction',
    });

    Sentry.getCurrentHub().configureScope((scope) => {
      scope.setSpan(transaction);

      scope.setContext('http', {
        method,
        url,
        headers,
      });
    });

    const span = Sentry.getCurrentHub().getScope().getSpan();

    span.startChild(spanContext);

    return { span, transaction };
  }

  startChild(spanContext: SpanContext) {
    return this.span.startChild(spanContext);
  }
}
