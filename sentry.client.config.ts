import * as Sentry from '@sentry/astro';

declare const __UMSA_SENTRY_DSN__: string;
declare const __UMSA_SENTRY_ENVIRONMENT__: string;
declare const __UMSA_SENTRY_RELEASE__: string;

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const dsn = import.meta.env.PUBLIC_SENTRY_DSN || __UMSA_SENTRY_DSN__;

Sentry.init({
  dsn,
  enabled: import.meta.env.PROD && Boolean(dsn),
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT || __UMSA_SENTRY_ENVIRONMENT__,
  release: import.meta.env.PUBLIC_SENTRY_RELEASE || __UMSA_SENTRY_RELEASE__,
  tracesSampleRate: numberFromEnv(import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE, 1.0),
  replaysSessionSampleRate: numberFromEnv(import.meta.env.PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE, 0.1),
  replaysOnErrorSampleRate: numberFromEnv(import.meta.env.PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, 1.0),
});
