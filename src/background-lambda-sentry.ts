import * as Sentry from '@sentry/serverless';
import { Handler } from 'aws-lambda';
import { getSecrets } from './env';

async function initBackgroundLambdaSentry() {
  // This has to come from environment variable because in this stage there is no access to secrets manager yet
  const secrets = await getSecrets();
  const dsn = secrets?.ALLOWLIST_SENTRY_DSN;
  if (dsn) {
    Sentry.AWSLambda.init({
      dsn,
      tracesSampleRate: 1.0,
      debug: true,
    });
    console.log(
      `Sentry initialized successfully with DSN ${dsn.slice(
        0,
        7,
      )}*****/${dsn.slice(-17)}`,
    );
    return true;
  } else {
    console.warn(
      'Sentry not initialized. Set secret ALLOWLIST_SENTRY_DSN to initialize',
    );
    return false;
  }
}

export function withSentryIfConfigured(handler: Handler): Handler {
  if (initBackgroundLambdaSentry()) {
    return Sentry.AWSLambda.wrapHandler(handler);
  }
  return handler;
}
