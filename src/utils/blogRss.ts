import rss from '@astrojs/rss';
import { SITE_URL } from '../config/seo';
import type { EntradaBlog } from '../lib/directus';
import { getCategoryLabel } from './blogUtils';

const escapeXml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/** Feed RSS 2.0 de un subconjunto del blog (categoría o tema), con enlace self. */
export async function buildBlogFeed({
  title,
  description,
  selfPath,
  posts,
}: {
  title: string;
  description: string;
  selfPath: string;
  posts: EntradaBlog[];
}): Promise<Response> {
  const response = await rss({
    title,
    description,
    site: SITE_URL,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: [
      '<language>es-AR</language>',
      `<atom:link href="${SITE_URL}${selfPath}" rel="self" type="application/rss+xml"/>`,
    ].join(''),
    items: posts
      .filter((post) => post.slug && post.titulo)
      .map((post) => {
        const pubDate = post.fecha_publicacion ? new Date(post.fecha_publicacion) : undefined;
        const link = `${SITE_URL}/blog/${post.slug}`;
        return {
          title: post.titulo,
          description: post.resumen || '',
          pubDate: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate : undefined,
          link,
          categories: [getCategoryLabel(post.categoria)].filter(Boolean),
          author: 'contacto@ultimamilla.com.ar (ULTIMA MILLA)',
          customData: `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
        };
      }),
  });
  response.headers.set('Cache-Control', 'public, max-age=900');
  return response;
}
