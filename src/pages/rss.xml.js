import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { SITE_URL } from '../config/seo';
import { fetchBlogListing } from '../utils/getBlogData';

export async function GET(context) {
	const { posts } = await fetchBlogListing(1, 50);
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site || SITE_URL,
		items: posts.map((post) => ({
			title: post.titulo,
			description: post.resumen,
			pubDate: post.fecha_publicacion ? new Date(post.fecha_publicacion) : undefined,
			link: `/blog/${post.slug}`,
		})),
	});
}
