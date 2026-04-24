const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function blogImageUrl(value: string | null | undefined): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
    return value;
  }
  if (UUID_RE.test(value)) {
    return `/directus-assets/${value}`;
  }
  return '';
}

export function bp(path: string): string {
  return path;
}
