import * as Sentry from '@sentry/aws-serverless';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENV,
});
