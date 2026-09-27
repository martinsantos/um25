/**
 * Dimensiones reales de imágenes propias para og:image:width/height.
 * Lee el encabezado del archivo servido (public/ en dev, dist/client/ en prod)
 * y cachea el resultado. Si no se puede medir devuelve null: es preferible
 * omitir las dimensiones antes que declarar valores falsos.
 */
import { localImagePath } from './seoOgImage';

type Dimensions = { width: number; height: number };

const cache = new Map<string, Dimensions | null>();

async function readDimensions(relativePath: string): Promise<Dimensions | null> {
  if (!/\.(avif|gif|jpe?g|png|webp)$/i.test(relativePath) || relativePath.includes('..')) return null;
  try {
    const [{ default: sharp }, fs, path] = await Promise.all([
      import('sharp'),
      import('node:fs'),
      import('node:path'),
    ]);
    const roots = [path.join(process.cwd(), 'dist', 'client'), path.join(process.cwd(), 'public')];
    for (const root of roots) {
      const file = path.join(root, relativePath);
      if (!fs.existsSync(file)) continue;
      const meta = await sharp(file).metadata();
      if (meta.width && meta.height) return { width: meta.width, height: meta.height };
    }
  } catch {
    return null;
  }
  return null;
}

export async function getLocalImageDimensions(image: string | null | undefined): Promise<Dimensions | null> {
  const relativePath = localImagePath(image);
  if (!relativePath) return null;
  if (cache.has(relativePath)) return cache.get(relativePath) ?? null;
  const dimensions = await readDimensions(relativePath);
  cache.set(relativePath, dimensions);
  return dimensions;
}
