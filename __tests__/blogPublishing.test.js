const {
  addVisibleBlogStatusFilter,
  normalizeBlogStatus,
  normalizePublicationDate,
} = require('../src/utils/blogPublishing');

describe('Blog publishing contract', () => {
  const now = new Date('2026-06-05T12:00:00.000Z');

  test('publishes immediately when publication date is absent or not future', () => {
    expect(normalizeBlogStatus(undefined, normalizePublicationDate(undefined, now), now)).toBe('published');
    expect(normalizeBlogStatus(undefined, '2026-06-05T08:00:00-03:00', now)).toBe('published');
  });

  test('schedules future publication dates even if published was requested', () => {
    expect(normalizeBlogStatus('published', '2026-06-05T17:00:00-03:00', now)).toBe('scheduled');
  });

  test('keeps explicit draft status', () => {
    expect(normalizeBlogStatus('draft', '2026-06-05T17:00:00-03:00', now)).toBe('draft');
  });

  test('builds a Directus filter for published posts and due scheduled posts', () => {
    const params = addVisibleBlogStatusFilter(new URLSearchParams(), now);
    expect(params.get('filter[_or][0][status][_eq]')).toBe('published');
    expect(params.get('filter[_or][1][_and][0][status][_eq]')).toBe('scheduled');
    expect(params.get('filter[_or][1][_and][1][fecha_publicacion][_lte]')).toBe(now.toISOString());
  });
});
