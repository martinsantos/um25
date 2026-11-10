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
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = request.signal ? AbortSignal.any([request.signal, timeout]) : timeout;
  return { ...request, signal };
}

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  // The signal also applies while the caller is reading the response body.
  const requestSignal = typeof Request !== 'undefined' && input instanceof Request ? input.signal : undefined;
  const signal = init.signal ?? requestSignal;
  return fetch(input, withTimeout({ ...init, signal }, timeoutMs));
}
