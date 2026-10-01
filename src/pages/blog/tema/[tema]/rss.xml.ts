import type { APIRoute } from 'astro';
import { fetchBlogPostsBySlugs } from '../../../../utils/getBlogData';
import { buildBlogFeed } from '../../../../utils/blogRss';
import { getServiceClusterByHubSlug } from '../../../../data/blogTopicTaxonomy';
import { TOPIC_HUB_MIN_POSTS, postsForCluster } from '../../../../utils/blogTopicMap';

export const GET: APIRoute = async ({ params }) => {
  const tema = params['tema'] || '';
  const cluster = getServiceClusterByHubSlug(tema);
  const clusterPosts = cluster ? postsForCluster('service', cluster.key) : [];
  if (!cluster || clusterPosts.length < TOPIC_HUB_MIN_POSTS) return new Response('Not found', { status: 404 });

  // Un feed es cronológico: las 20 notas más recientes del tema.
  const recent = [...clusterPosts]
    .sort((a, b) => Date.parse(b.entry.published || '') - Date.parse(a.entry.published || ''))
    .slice(0, 20);
  const posts = await fetchBlogPostsBySlugs(recent.map((item) => item.entry.slug));
  return buildBlogFeed({
    title: `Blog ULTIMA MILLA · ${cluster.label}`,
    description: `Notas técnicas de ULTIMA MILLA sobre ${cluster.label.charAt(0).toLowerCase()}${cluster.label.slice(1)}.`,
    selfPath: `/blog/tema/${tema}/rss.xml`,
    posts,
  });
};
