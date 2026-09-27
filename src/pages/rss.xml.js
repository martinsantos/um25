import rss from '@astrojs/rss';
import { SITE_URL } from '../config/seo';
import { fetchBlogListing } from '../utils/getBlogData';
import { getCategoryLabel } from '../utils/blogUtils';

const escapeXml = (value) => String(value ?? '')
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;');

export async function GET() {
	const { posts } = await fetchBlogListing(1, 30);
	const response = await rss({
		title: 'Blog técnico de ULTIMA MILLA',
		description: 'Artículos técnicos sobre infraestructura IT, redes, telecomunicaciones, seguridad electrónica y software para empresas de Argentina.',
		site: SITE_URL,
		xmlns: { atom: 'http://www.w3.org/2005/Atom' },
		customData: [
			'<language>es-AR</language>',
			`<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>`,
		].join(''),
		items: posts
			.filter((post) => post.slug && post.titulo)
			.map((post) => {
				const pubDate = post.fecha_publicacion ? new Date(post.fecha_publicacion) : undefined;
				return {
					title: post.titulo,
					description: post.resumen || '',
					pubDate: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate : undefined,
					link: `${SITE_URL}/blog/${post.slug}`,
					categories: [getCategoryLabel(post.categoria)].filter(Boolean),
					author: 'contacto@ultimamilla.com.ar (ULTIMA MILLA)',
					customData: `<guid isPermaLink="true">${escapeXml(`${SITE_URL}/blog/${post.slug}`)}</guid>`,
				};
			}),
	});
	response.headers.set('Cache-Control', 'public, max-age=900');
	return response;
}
