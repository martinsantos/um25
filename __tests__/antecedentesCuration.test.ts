import antecedentesSnapshot from '../src/data/snapshots/antecedentes.json';
import {
  curateAntecedente,
  formatAntecedenteYear,
  isPromotableAntecedente,
  sortAntecedentesForPublicList,
} from '../src/utils/antecedentesCuration';
import { buildGeoCaseResourcesFromAntecedentes, buildGeoCasesResource } from '../src/data/geoResources';

const antecedentes = (antecedentesSnapshot as { data: Array<Record<string, any>> }).data;
const byId = (id: number) => antecedentes.find((item) => Number(item.id) === id) as Record<string, any>;

describe('antecedentes curation', () => {
  test('curates the complete published antecedentes snapshot without dropping records', () => {
    const curated = antecedentes.map((item) => curateAntecedente(item));

    expect(curated).toHaveLength(518);
    expect(curated.every((item) => item.displayTitle.length > 0)).toBe(true);
    expect(curated.every((item) => item.displayDescription.length > 0)).toBe(true);
    expect(curated.every((item) => item.canonicalPath.startsWith(`/antecedentes/${item.id}/`))).toBe(true);
  });

  test('keeps strategic cases promotable and demotes low-value supply records', () => {
    const softwareGobierno = curateAntecedente(byId(3064));
    const pcMonitor = curateAntecedente(byId(3623));
    const discoDuro = curateAntecedente(byId(3591));

    expect(softwareGobierno.curation.quality).toBe('strong-case');
    expect(softwareGobierno.curation.recordLabel).toBe('Caso operativo');
    expect(isPromotableAntecedente(softwareGobierno)).toBe(true);
    expect(pcMonitor.curation.quality).toBe('low-value-candidate');
    expect(pcMonitor.curation.recordLabel).toBe('Proyecto técnico');
    expect(discoDuro.curation.quality).toBe('low-value-candidate');
    expect(isPromotableAntecedente(pcMonitor)).toBe(false);
  });

  test('flags real data errors and only applies deterministic spelling cleanup for display', () => {
    const remplazo = curateAntecedente(byId(3087));
    const universidad = curateAntecedente(byId(3484));
    const camaras = curateAntecedente(byId(3578));

    expect(remplazo.curation.quality).toBe('data-error-candidate');
    expect(remplazo.curation.issues).toContain('typo:remplazo');
    expect(remplazo.displayTitle).toContain('Reemplazo');
    expect(universidad.curation.issues).toContain('typo:univercidad');
    expect(universidad.displayTitle).toContain('Universidad del Aconcagua');
    expect(camaras.curation.issues).toContain('typo:cpamaras');
    expect(camaras.displayTitle).toContain('cámaras');
  });

  test('public ordering starts with promotable cases and never renders Invalid Date as a year', () => {
    const sorted = sortAntecedentesForPublicList(antecedentes);

    expect(sorted.slice(0, 12).every((item) => item.curation.quality === 'strong-case')).toBe(true);
    expect(formatAntecedenteYear('Invalid Date')).toBe('sin fecha');
    expect(formatAntecedenteYear('')).toBe('sin fecha');
  });

  test('GEO cases prefer curated strong evidence over weak inventory records', () => {
    const payload = buildGeoCasesResource(buildGeoCaseResourcesFromAntecedentes(antecedentes as any)) as {
      cases: Array<{ id: number; quality: string; title: string; client: string | null }>;
    };

    const ids = new Set(payload.cases.map((item) => Number(item.id)));

    expect(payload.cases.length).toBeGreaterThanOrEqual(100);
    expect(ids.has(3064)).toBe(true);
    expect(ids.has(3623)).toBe(false);
    expect(ids.has(3591)).toBe(false);
    expect(payload.cases.every((item) => item.title && item.quality !== 'low-value-candidate')).toBe(true);
  });
});
