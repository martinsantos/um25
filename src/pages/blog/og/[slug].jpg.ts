import type { APIRoute } from 'astro';
import { fetchBlogPost } from '../../../utils/getBlogData';
import { blogPostImageUrl } from '../../../utils/blogHelpers';
import { DEFAULT_OG_IMAGE_PATH, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, localImagePath, ogVariantFor } from '../../../utils/seoOgImage';

/**
 * Imagen Open Graph 1200×630 de cada artículo, recortada desde su portada.
 * Se genera en el primer pedido y se cachea en memoria; el CDN/navegador la
 * guarda un día. Si la portada no se puede leer, redirige a la imagen por defecto.
 */
const cache = new Map<string, { at: number; body: Uint8Array }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;

async function readLocalImage(relativePath: string): Promise<Buffer | null> {
  if (relativePath.includes('..')) return null;
  const [fs, path] = await Promise.all([import('node:fs/promises'), import('node:path')]);
  for (const root of [path.join(process.cwd(), 'dist', 'client'), path.join(process.cwd(), 'public')]) {
    try {
      return await fs.readFile(path.join(root, relativePath));
    } catch {
      // probar la siguiente raíz
    }
  }
  return null;
}

async function readImage(source: string, origin: string): Promise<Buffer | null> {
  const variant = ogVariantFor(source);
  const local = localImagePath(variant || source);
  if (local) {
    const file = await readLocalImage(local);
    if (file) return file;
    // Assets servidos por rutas (p. ej. /api/asset/<uuid>): pedirlos al propio sitio.
    try {
      const res = await fetch(new URL(local, origin), { signal: AbortSignal.timeout(5000) });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
    return null;
  }
  return null;
}

export const GET: APIRoute = async ({ params, url, redirect }) => {
  const slug = String(params.slug || '');
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return new Response(cached.body, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    });
  }

  try {
    const post = await fetchBlogPost(slug);
    if (!post) return redirect(DEFAULT_OG_IMAGE_PATH, 302);
    const source = await readImage(blogPostImageUrl(post), url.origin);
    if (!source) return redirect(DEFAULT_OG_IMAGE_PATH, 302);

    const { default: sharp } = await import('sharp');
    const output = await sharp(source)
      .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    const body = new Uint8Array(output);

    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
    cache.set(slug, { at: Date.now(), body });

    return new Response(body, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    });
  } catch {
    return redirect(DEFAULT_OG_IMAGE_PATH, 302);
  }
};
