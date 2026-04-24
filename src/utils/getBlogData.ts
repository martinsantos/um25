import type { EntradaBlog } from '../lib/directus';
import { MOCK_POSTS } from '../data/blog-mock';

const DIRECTUS_URL =
  (typeof process !== 'undefined' ? process.env.DIRECTUS_INTERNAL_URL : undefined) ??
  import.meta.env.DIRECTUS_INTERNAL_URL ??
  'http://localhost:8055';

const DIRECTUS_TOKEN =
  (typeof process !== 'undefined' ? process.env.DIRECTUS_ADMIN_TOKEN : undefined) ??
  import.meta.env.DIRECTUS_ADMIN_TOKEN ??
  '1d70b2841dd6365c676ab42e879c5fdfc044ec1adfc146552a99b2d7e23baa5e';

function authHeaders() {
  return { Authorization: `Bearer ${DIRECTUS_TOKEN}` };
}

export async function fetchBlogListing(
  page = 1,
  limit = 10,
  categoria?: string
): Promise<{ posts: EntradaBlog[]; total: number }> {
  const catFilter = categoria ? `&filter[categoria][_eq]=${encodeURIComponent(categoria)}` : '';
  const fields = 'id,slug,titulo,resumen,imagen_portada,categoria,fecha_publicacion,tiempo_lectura';
  const offset = (page - 1) * limit;

  try {
    const [itemsRes, countRes] = await Promise.all([
      fetch(
        `${DIRECTUS_URL}/items/blog_posts?filter[status][_eq]=published${catFilter}&sort=-fecha_publicacion&limit=${limit}&offset=${offset}&fields=${fields}`,
        { headers: authHeaders() }
      ),
      fetch(
        `${DIRECTUS_URL}/items/blog_posts?aggregate[count]=id&filter[status][_eq]=published${catFilter}`,
        { headers: authHeaders() }
      ),
    ]);

    const [itemsData, countData] = await Promise.all([itemsRes.json(), countRes.json()]);
    const posts = (itemsData.data || []) as EntradaBlog[];
    const total = Number(countData.data?.[0]?.count?.id || 0);

    if (posts.length > 0) return { posts, total };
    throw new Error('empty');
  } catch {
    const filtered = categoria ? MOCK_POSTS.filter(p => p.categoria === categoria) : MOCK_POSTS;
    return { posts: filtered.slice(offset, offset + limit), total: filtered.length };
  }
}

export async function fetchBlogPost(slug: string): Promise<EntradaBlog | null> {
  try {
    const res = await fetch(
      `${DIRECTUS_URL}/items/blog_posts?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&limit=1&fields=*`,
      { headers: authHeaders() }
    );
    const data = await res.json();
    const post = (data.data || [])[0] as EntradaBlog | undefined;
    if (post) return post;
    throw new Error('not found');
  } catch {
    return MOCK_POSTS.find(p => p.slug === slug) || null;
  }
}

export async function fetchBlogBand(limit = 3): Promise<EntradaBlog[]> {
  try {
    const res = await fetch(
      `${DIRECTUS_URL}/items/blog_posts?filter[status][_eq]=published&sort=-fecha_publicacion&limit=${limit}&fields=id,slug,titulo,imagen_portada,categoria,fecha_publicacion`,
      { headers: authHeaders() }
    );
    const data = await res.json();
    const posts = (data.data || []) as EntradaBlog[];
    if (posts.length > 0) return posts;
    throw new Error('empty');
  } catch {
    return MOCK_POSTS.slice(0, limit);
  }
}
