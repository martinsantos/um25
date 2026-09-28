import type { APIRoute } from 'astro';
import { fetchBlogListing } from '../../../../utils/getBlogData';
import { getCategoryLabel } from '../../../../utils/blogUtils';
import { buildBlogFeed } from '../../../../utils/blogRss';

const VALID_CATS = ['noticias', 'proyectos', 'tecnico', 'tecnologia', 'empresa'];

export const GET: APIRoute = async ({ params }) => {
  const cat = params['cat'] || '';
  if (!VALID_CATS.includes(cat)) return new Response('Not found', { status: 404 });
  const { posts } = await fetchBlogListing(1, 30, cat);
  const label = getCategoryLabel(cat);
  return buildBlogFeed({
    title: `Blog ULTIMA MILLA · ${label}`,
    description: `Artículos de ${label.toLowerCase()} del blog técnico de ULTIMA MILLA.`,
    selfPath: `/blog/categoria/${cat}/rss.xml`,
    posts,
  });
};
