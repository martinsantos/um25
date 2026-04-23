const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

/** Returns the URL for a Directus image UUID via the nginx proxy. */
export function blogImageUrl(uuid: string | null | undefined): string {
  if (!uuid || !UUID_RE.test(uuid)) return '';
  return `/directus-assets/${uuid}`;
}

/** Identity path helper — in SSR, BASE_URL is '/' so withBase is a no-op. */
export function bp(path: string): string {
  return path;
}
