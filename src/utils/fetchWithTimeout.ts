/**
 * Fetch helpers for SSR dependencies.
 *
 * A stalled CMS must degrade to snapshots instead of keeping an Astro
 * request open until the reverse proxy gives up.
 */
export const DEFAULT_FETCH_TIMEOUT_MS = 5000;

export function getFetchTimeoutMs(
  value: string | undefined,
  fallback = DEFAULT_FETCH_TIMEOUT_MS,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 250) return fallback;
  return Math.min(parsed, 30_000);
}

export function withTimeout(request: RequestInit, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS): RequestInit {
  if (request.signal) return request;
  return {
    ...request,
    signal: AbortSignal.timeout(timeoutMs),
  };
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  if (init.signal) return fetch(input, init);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
