import fs from 'node:fs';
import path from 'node:path';

import { NAV_SECTORS } from '../data/navigation';
import serviceFiles from '../data/serviceDatasheetFiles.json';

const filenames: Record<string, string> = serviceFiles;
const DATASHEETS_DIRS = [path.join(process.cwd(), 'dist', 'client', 'datasheets'), path.join(process.cwd(), 'public', 'datasheets')];

/** Ruta pública del PDF si existe en public/datasheets/{slug}.pdf */
export function getDatasheetPublicPath(slug: string): string | null {
  const safe = slug.replace(/[^a-z0-9-]/gi, '').toLowerCase();
  if (!safe) return null;

  for (const name of [safe, filenames[safe]]) {
    if (typeof name === 'string' && DATASHEETS_DIRS.some(dir => fs.existsSync(path.join(dir, `${name}.pdf`)))) {
      return `/datasheets/${name}.pdf`;
    }
  }
  return null;
}

export function datasheetSource(params: URLSearchParams, code: string) {
  const slug = params.get('sector');
  const sector = NAV_SECTORS.find(item => item.slug === slug && (
    item.href.startsWith('/sectores/') || (item.slug === 'software' && code === '104') ||
    (item.slug === 'seguridad-electronica' && code === '102')
  ));
  const from = params.get('desde');
  const desde = !sector && (from === 'documentacion' || from === 'entregables') ? from : undefined;
  return { sector, desde };
}
