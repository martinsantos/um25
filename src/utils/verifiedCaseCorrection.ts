import { verifiedHistoricalCaseCorrection, type HistoricalCorrection } from './verifiedHistoricalCaseCorrection';
import sameRecordCorrections from '../data/propuesta/same-record-corrections.json';

/** Correcciones limitadas a fichas cuya descripción contradice el título importado.
 * Los registros históricos 11174, 10931 y 10893 coinciden con cliente y fecha de inicio SGI.
 * Si cambia cualquiera de los campos de identidad del registro web, no se aplica.
 */
type Source = { id: number | string; client: unknown; title: unknown; summary: unknown; year: number };
type Correction = HistoricalCorrection;

const rules: Record<number, { match: Omit<Source, 'id'>; alternativeSummaries?: string[]; value: Correction }> = {
  ...sameRecordCorrections,
  3103: {
    match: {
      client: 'FUESMEN - Fundación Escuela Medicina Nuclear',
      title: 'Corrientes débiles y eléctricas para el Hospital Uspallata',
      summary: 'Ejecución integral de CE - Hospital Uspallata para FUESMEN - Fundación Escuela Medicina Nuclear, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad. Solución implementada por el equipo de ingeniería de Última Milla.',
      year: 2024,
    },
    alternativeSummaries: ['Corrientes débiles y eléctricas para el Hospital Uspallata Cliente: FUESMEN - Fundación Escuela Medicina Nuclear. Sector: Salud & Sector Salud.'],
    value: {
      title: 'Cableado estructurado en el Hospital de Uspallata',
      summary: 'Cableado estructurado para 33 puestos de datos categoría 6, con rack mural y canalización.',
      services: [101],
    },
  },
  3295: {
    match: {
      client: 'Bodega Caro',
      title: 'Implementación de Redes de Datos y Fibra Óptica - Bodega Caro',
      summary: 'Canalización y cableado para traslado de Central de Detección de inc',
      year: 2021,
    },
    value: {
      title: 'Canalización y cableado para traslado de central de detección de incendios',
      summary: 'Canalización y cableado para el traslado de una central de detección de incendios.',
      services: [107],
    },
  },
  3388: {
    match: {
      client: 'AFIP',
      title: 'Desarrollo de Software y Digitalización de Procesos - AFIP',
      summary: 'Sistema de Detección de Incendio sede de San Martin, San Rafael, San',
      year: 2019,
    },
    value: {
      title: 'Sistema de detección de incendios para sedes de AFIP',
      summary: 'Sistema de detección de incendios para sedes de AFIP.',
      services: [107],
    },
  },
};

const normal = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

export function verifiedCaseCorrection(source: Source): Correction | undefined {
  const rule = rules[Number(source.id)];
  if (!rule) return verifiedHistoricalCaseCorrection(source);
  if (source.year !== rule.match.year) return undefined;
  if (normal(source.client) !== normal(rule.match.client)
      || normal(source.title) !== normal(rule.match.title)
      || ![rule.match.summary, ...(rule.alternativeSummaries || [])].some((summary) => normal(source.summary) === normal(summary))) return undefined;
  return rule.value;
}
