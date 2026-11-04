import { mapearAntecedentes } from '../lib/um26-data/antecedentesReales';
import { verifiedCaseCorrection } from './verifiedCaseCorrection';
import { documentedCompletion, type CompletionEntry } from '../components/proto/catalogCompletion';
import completions from '../data/propuesta/catalog-completions.json';
import { getAntecedenteSectorLabel } from './antecedenteSectorPresentation';

type RecordSource = { id: number | string; Titulo?: string; Descripcion?: string; Cliente?: string; Area?: string; Fecha?: string };
/** Use the same guarded source corrections in static topic/GEO indexes as the public case page. */
export function publicCaseRecord<T extends RecordSource>(record: T): T & { canonicalPath: string } {
  const source = mapearAntecedentes([{ ...record, id: Number(record.id) }])[0];
  if (!source) return { ...record, canonicalPath: `/antecedentes/${record.id}` };
  const correction = verifiedCaseCorrection(source);
  const completion = documentedCompletion(source.id, source, completions.entries as CompletionEntry[]);
  const sector = completion?.sector ?? correction?.sector;
  return { ...record,
    Titulo: completion?.title ?? correction?.title ?? record.Titulo,
    Descripcion: completion?.summary ?? correction?.summary ?? record.Descripcion,
    Area: sector === undefined ? record.Area : sector ? getAntecedenteSectorLabel(sector === 'gobiernosectorpublico' ? 'gobierno' : sector) || '' : '',
    canonicalPath: `/antecedentes/${source.id}/${source.slug}`,
  };
}
