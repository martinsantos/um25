export const BLOG_LISTING_CATEGORIES = [
  'noticias',
  'proyectos',
  'tecnico',
  'tecnologia',
  'empresa',
] as const;

export type BlogListingCategory = (typeof BLOG_LISTING_CATEGORIES)[number];

export interface BlogListingRoute {
  page: number;
  category?: BlogListingCategory;
  invalidCategory: boolean;
  canonicalPath?: string;
  redirectTo?: string;
}

function positiveIntegerOrOne(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function canonicalBlogPath(page: number, category?: BlogListingCategory): string {
  const params = new URLSearchParams();
  if (category) params.set('categoria', category);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : '/blog';
}

/** Parses the archive query and migrates the old `p` parameter to production's `page`. */
export function resolveBlogListingRoute(url: URL): BlogListingRoute {
  const params = url.searchParams;
  const hasCategory = params.has('categoria');
  const rawCategory = params.get('categoria');
  const category = BLOG_LISTING_CATEGORIES.find((allowed) => allowed === rawCategory);
  if (hasCategory && !category) {
    return { page: 1, invalidCategory: true };
  }

  const pageParam = params.has('page') ? params.get('page') : params.get('p');
  const page = positiveIntegerOrOne(pageParam);
  const canonicalPath = canonicalBlogPath(page, category);
  const normalizePage = params.has('page') && (pageParam !== String(page) || page === 1);

  return {
    page,
    category,
    invalidCategory: false,
    canonicalPath,
    ...(params.has('p') || normalizePage ? { redirectTo: canonicalPath } : {}),
  };
}
