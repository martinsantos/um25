export { renderers } from '../renderers.mjs';

const SITE_URL = "https://ultimamilla.com";
const GET = async () => {
  const robotsTxt = `# www.robotstxt.org

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Archivos específicos a no indexar
Disallow: /*.json$
Disallow: /*.js$
Disallow: /*.css$

# Permitir principales directorios
Allow: /blog/
Allow: /servicios/
Allow: /nosotros/
Allow: /contacto/

# Crawl-delay
Crawl-delay: 10`;
  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
