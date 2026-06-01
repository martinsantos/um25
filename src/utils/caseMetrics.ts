/**
 * Extrae KPIs verificables del texto CMS (Titulo/Descripcion).
 * Solo devuelve métricas explícitas en el copy — sin inventar números.
 */
export type CaseMetric = { value: string; label: string };

type AntecedenteLike = {
  Titulo?: string;
  Nombre?: string;
  Descripcion?: string;
};

type PatternRule = {
  regex: RegExp;
  format: (match: RegExpMatchArray) => CaseMetric | null;
};

const PATTERN_RULES: PatternRule[] = [
  {
    regex: /(\d+)\s*c[aá]maras?\s+(?:de\s+)?CCTV/i,
    format: (m) => ({ value: m[1], label: 'cámaras CCTV' }),
  },
  {
    regex: /(\d+)\s*c[aá]maras?/i,
    format: (m) => ({ value: m[1], label: 'cámaras' }),
  },
  {
    regex: /(\d+)\s*(?:terminales|sedes|nodos|puntos)/i,
    format: (m) => ({
      value: m[1],
      label: m[0].replace(/^\d+\s*/i, '').trim(),
    }),
  },
  {
    regex: /24\s*\/\s*7/i,
    format: () => ({ value: '24/7', label: 'cobertura operativa' }),
  },
  {
    regex: /<\s*(\d+(?:[.,]\d+)?)\s*h(?:oras?)?/i,
    format: (m) => ({ value: `< ${m[1].replace(',', '.')} h`, label: 'tiempo de respuesta' }),
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*%/,
    format: (m) => ({ value: `${m[1].replace(',', '.')}%`, label: 'indicador documentado' }),
  },
];

function metricKey(metric: CaseMetric): string {
  return `${metric.value}|${metric.label}`.toLowerCase();
}

/** Hasta 2 métricas por caso, derivadas solo del snapshot CMS. */
export function extractCaseMetricsFromAntecedente(item: AntecedenteLike): CaseMetric[] {
  const text = `${item.Titulo || item.Nombre || ''} ${item.Descripcion || ''}`.trim();
  if (!text) return [];

  const found: CaseMetric[] = [];
  const seen = new Set<string>();

  for (const { regex, format } of PATTERN_RULES) {
    const match = text.match(regex);
    if (!match) continue;

    const metric = format(match);
    if (!metric?.value || !metric.label) continue;

    const key = metricKey(metric);
    if (seen.has(key)) continue;

    seen.add(key);
    found.push(metric);
    if (found.length >= 2) break;
  }

  return found;
}
