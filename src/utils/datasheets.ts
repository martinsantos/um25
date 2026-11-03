import fs from 'node:fs';
import path from 'node:path';

const DATASHEETS_DIRS = [path.join(process.cwd(), 'dist', 'client', 'datasheets'), path.join(process.cwd(), 'public', 'datasheets')];

/** Ruta pública del PDF si existe en public/datasheets/{slug}.pdf */
export function getDatasheetPublicPath(slug: string): string | null {
  const safe = slug.replace(/[^a-z0-9-]/gi, '').toLowerCase();
  if (!safe) return null;

  if (!DATASHEETS_DIRS.some(dir => fs.existsSync(path.join(dir, `${safe}.pdf`)))) return null;

  return `/datasheets/${safe}.pdf`;
}
