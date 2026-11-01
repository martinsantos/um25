type SoftwareCandidate = Record<string, unknown>;

const normalize = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/<[^>]*>/g, ' ')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Candidate terms include the legacy software keywords plus explicit terms for
 * software systems. The final relevance check below rejects generic matches
 * such as "sistemas de detección".
 */
export const SOFTWARE_SECTOR_QUERY_TERMS = [
  'software',
  'programacion',
  'programación',
  'aplicacion',
  'aplicación',
  'aplicaciones',
  'web',
  'api',
  'erp',
  'plataforma',
  'plataformas',
  'sistema de gestion',
  'sistemas de gestion',
  'sistema de trazabilidad',
  'sistemas de trazabilidad',
  'digitalizacion de procesos',
  'digitalización de procesos',
] as const;

const SOFTWARE_SIGNALS = [
  /\bsoftware\b/,
  /\bprogramacion\b/,
  /\baplicacion(?:es)?\b/,
  /\bdesarrollo(?: de)? software\b/,
  /\b(?:desarrollo|servicios?|portal|sitio|pagina) web\b/,
  /\bapis?\b/,
  /\berp\b/,
  /\bplataformas?\b/,
  /\bdigitalizacion de procesos\b/,
  /\bsistemas? de (?:gestion|trazabilidad|informacion|expedientes|turnos|ventas|facturacion|administracion|inventario|clientes|recursos humanos|licitaciones)\b/,
];

export function softwareSectorCandidateKeywords(existingKeywords: string[] = []): string[] {
  return [...new Set([...existingKeywords, ...SOFTWARE_SECTOR_QUERY_TERMS])];
}

export function isSoftwareSectorCase(candidate: SoftwareCandidate): boolean {
  const evidence = normalize([
    candidate['Titulo'],
    candidate['Descripcion'],
    candidate['Area'],
    candidate['Nombre'],
  ].filter(Boolean).join(' '));

  return SOFTWARE_SIGNALS.some((signal) => signal.test(evidence));
}

export function filterSoftwareSectorCases<T extends SoftwareCandidate>(
  candidates: T[],
  limit = 6,
): T[] {
  return candidates.filter(isSoftwareSectorCase).slice(0, Math.max(0, limit));
}
