import type { SectorSlug } from '../lib/um26-data/types';

/**
 * Public labels for the canonical sector slugs used by the antecedentes index.
 * Keep this presentation map shared between cards and case detail pages.
 */
export const ANTECEDENTE_SECTOR_LABELS: Record<SectorSlug, string> = {
  aeropuertos: 'Aeropuertos',
  bodegas: 'Bodegas',
  constructoras: 'Constructoras',
  gobierno: 'Gobierno',
  industria: 'Industria',
  mineria: 'Minería',
  salud: 'Salud',
  'seguridad-electronica': 'Seguridad electrónica',
  software: 'Software',
};

/** Returns null for missing/unrecognized slugs instead of inventing a label. */
export function getAntecedenteSectorLabel(value: unknown): string | null {
  const slug = String(value ?? '').trim() as SectorSlug;
  return Object.prototype.hasOwnProperty.call(ANTECEDENTE_SECTOR_LABELS, slug)
    ? ANTECEDENTE_SECTOR_LABELS[slug]
    : null;
}
