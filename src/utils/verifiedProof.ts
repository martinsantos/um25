/**
 * Métricas y nombres verificables desde snapshot CMS (src/data/snapshots/antecedentes.json).
 * No inventar ISO, certificaciones corporativas ni conteos distintos al catálogo publicado.
 */
import antecedentesSnapshot from '../data/snapshots/antecedentes.json';

type SnapshotCase = {
  Cliente?: string;
  Titulo?: string;
};

type Snapshot<T> = { data?: T[] } | T[];

function snapshotCases(): SnapshotCase[] {
  const raw = antecedentesSnapshot as Snapshot<SnapshotCase>;
  return Array.isArray(raw) ? raw : raw.data || [];
}

/** Total de registros en el snapshot publicado (alineado con Directus en build). */
export function getAntecedentesCatalogCount(): number {
  return snapshotCases().length;
}

/**
 * Etiqueta corta para chips/stats (redondeo conservador ≥500 según DESIGN.md).
 */
export function getAntecedentesCountShort(): string {
  const n = getAntecedentesCatalogCount();
  if (n <= 0) return '—';
  if (n >= 500) return '500+';
  return `${n}+`;
}

/** Etiqueta explícita con conteo del catálogo (p. ej. copy factual / llms). */
export function getAntecedentesCountExactPhrase(): string {
  const n = getAntecedentesCatalogCount();
  if (n <= 0) return 'antecedentes documentados';
  return `${n} antecedentes documentados`;
}

/** Clientes con más proyectos en el campo Cliente del CMS (solo texto, sin logos). */
export function getTopClienteNames(limit = 6): string[] {
  const counts = new Map<string, number>();

  for (const item of snapshotCases()) {
    const name = String(item.Cliente || '').trim();
    if (name.length < 3) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, limit)
    .map(([name]) => name);
}

/** Líneas de prueba para hubs GEO / llms — sin ISO ni certificaciones inventadas. */
export function getInstitutionalProofLines(): string[] {
  return [
    getAntecedentesCountExactPhrase(),
    '22+ años de trayectoria',
    '8 frentes de servicio',
    'Soporte y operación 24/7',
  ];
}
