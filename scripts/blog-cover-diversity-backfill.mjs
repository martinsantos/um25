// El archivo identifica sus portadas por nota. El backfill anterior ya no escribe en Directus.
import { pathToFileURL } from 'node:url';
export async function run() {
  if (process.argv.includes('--apply')) throw new Error('No se reasignan portadas automáticamente. Corregí la nota o su asociación editorial revisada.');
  const res = await fetch('https://www.ultimamilla.com.ar/sitemap-blog.xml');
  if (!res.ok) throw new Error('No se pudo leer el sitemap público: '+res.status);
  const xml = await res.text();
  const covers = [...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(m => m[1]);
  console.log(JSON.stringify({ mode:'read-only', covers:covers.length, distinct:new Set(covers).size }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(e => { console.error(e.message); process.exitCode=1; });
}
