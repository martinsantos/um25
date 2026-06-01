import fs from 'node:fs';
import path from 'node:path';

const DATASHEETS_DIR = path.join(process.cwd(), 'public', 'datasheets');

/** Ruta pública del PDF si existe en public/datasheets/{slug}.pdf */
export function getDatasheetPublicPath(slug: string): string | null {
  const safe = slug.replace(/[^a-z0-9-]/gi, '').toLowerCase();
  if (!safe) return null;

  const filePath = path.join(DATASHEETS_DIR, `${safe}.pdf`);
  if (!fs.existsSync(filePath)) return null;

  return `/datasheets/${safe}.pdf`;
}
