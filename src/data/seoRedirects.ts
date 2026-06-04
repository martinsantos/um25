export const blogCanonicalRedirects: Record<string, string> = {
  'test-full-content-1777817727': 'restic-y-postgresql-el-backup-que-si-vuelve',
  'paperless-ngx-estudio-contable-resma-automatica-v2': 'paperless-ngx-estudio-contable-resma-automatica',
  'bienvenidos-al-blog-de-ultima-milla': 'bienvenidos',
};

export const nonCanonicalBlogSlugs = new Set(Object.keys(blogCanonicalRedirects));

export function resolveCanonicalBlogSlug(slug: string): string {
  return blogCanonicalRedirects[slug] || slug;
}

export function isCanonicalBlogSlug(slug: string): boolean {
  return !nonCanonicalBlogSlugs.has(slug);
}
