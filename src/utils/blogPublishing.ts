export type BlogPublishStatus = 'published' | 'scheduled' | 'draft';

const VALID_STATUSES = new Set<BlogPublishStatus>(['published', 'scheduled', 'draft']);

function parseDate(value: string): number | null {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function normalizePublicationDate(value: unknown, now = new Date()): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return now.toISOString();
}

export function isFuturePublicationDate(value: string, now = new Date()): boolean {
  const time = parseDate(value);
  return time !== null && time > now.getTime();
}

export function normalizeBlogStatus(
  requestedStatus: unknown,
  fechaPublicacion: string,
  now = new Date(),
): BlogPublishStatus {
  const status = typeof requestedStatus === 'string' ? requestedStatus.trim() : '';
  if (status === 'draft') return 'draft';
  if (status === 'scheduled') return 'scheduled';
  if (VALID_STATUSES.has(status as BlogPublishStatus) && !isFuturePublicationDate(fechaPublicacion, now)) {
    return status as BlogPublishStatus;
  }
  return isFuturePublicationDate(fechaPublicacion, now) ? 'scheduled' : 'published';
}

export function addVisibleBlogStatusFilter(
  params: URLSearchParams,
  now = new Date(),
  prefix = 'filter',
): URLSearchParams {
  params.set(`${prefix}[_or][0][status][_eq]`, 'published');
  params.set(`${prefix}[_or][1][_and][0][status][_eq]`, 'scheduled');
  params.set(`${prefix}[_or][1][_and][1][fecha_publicacion][_lte]`, now.toISOString());
  return params;
}

export function visibleBlogStatusDirectusFilter(now = new Date()) {
  return {
    _or: [
      { status: { _eq: 'published' } },
      {
        _and: [
          { status: { _eq: 'scheduled' } },
          { fecha_publicacion: { _lte: now.toISOString() } },
        ],
      },
    ],
  };
}
