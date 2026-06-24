import * as Sentry from '@sentry/astro';

declare const __UMSA_SENTRY_DSN__: string;
declare const __UMSA_SENTRY_ENVIRONMENT__: string;
declare const __UMSA_SENTRY_RELEASE__: string;

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const dsn = process.env.SENTRY_DSN || process.env.PUBLIC_SENTRY_DSN || __UMSA_SENTRY_DSN__;

Sentry.init({
  dsn,
  enabled: process.env.NODE_ENV === 'production' && Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || __UMSA_SENTRY_ENVIRONMENT__,
  release: process.env.SENTRY_RELEASE || __UMSA_SENTRY_RELEASE__,
  tracesSampleRate: numberFromEnv(process.env.SENTRY_TRACES_SAMPLE_RATE, 1.0),
});
