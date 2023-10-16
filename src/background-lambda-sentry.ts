import * as Sentry from '@sentry/serverless';
import { Handler } from 'aws-lambda';
import { getSecrets } from './env';

async function initBackgroundLambdaSentry() {
  // This has to come from environment variable because in this stage there is no access to secrets manager yet
  const secrets = await getSecrets();
  if (secrets?.ALLOWLISY_SENTRY_DSN) {
    Sentry.AWSLambda.init({
      dsn: secrets.ALLOWLISY_SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
    return true;
  } else {
    console.warn(
      'Sentry not initialized. Set secret ALLOWLISY_SENTRY_DSN to initialize',
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
