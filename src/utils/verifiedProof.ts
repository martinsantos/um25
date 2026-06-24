/**
 * Métricas y nombres verificables desde snapshot CMS (src/data/snapshots/antecedentes.json).
 * No inventar ISO, certificaciones corporativas ni conteos distintos al catálogo publicado.
 */
import antecedentesSnapshot from '../data/snapshots/antecedentes.json';

type SnapshotCase = {
  Cliente?: string;
  Titulo?: string;
  Area?: string;
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
  if (n <= 0) return 'antecedentes técnicos';
  return `${n} antecedentes técnicos`;
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

/** Clientes frecuentes con cantidad de antecedentes técnicos y vertical dominante. */
export function getTopClienteRecords(limit = 6): { name: string; count: number; dominantArea: string }[] {
  const counts = new Map<string, number>();
  const areasByClient = new Map<string, Map<string, number>>();

  for (const item of snapshotCases()) {
    const name = String(item.Cliente || '').trim();
    if (name.length < 3) continue;
    counts.set(name, (counts.get(name) || 0) + 1);

    const area = String(item.Area || '').trim();
    if (area.length >= 3) {
      const areas = areasByClient.get(name) || new Map<string, number>();
      areas.set(area, (areas.get(area) || 0) + 1);
      areasByClient.set(name, areas);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, limit)
    .map(([name, count]) => {
      const areas = areasByClient.get(name);
      const dominantArea = areas
        ? [...areas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))[0]?.[0]
        : '';
      return { name, count, dominantArea: dominantArea || 'Servicios IT' };
    });
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
