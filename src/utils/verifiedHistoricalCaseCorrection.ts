import { antecedentesReales } from '../data/antecedentes_completos.js';
import dates from '../data/sgi/fechas.json';
import data from '../data/propuesta/historical-corrections.json';

export type HistoricalSource = { id: number | string; client: unknown; title: unknown; summary: unknown; year: number };
export type HistoricalCorrection = { title: string; summary: string; services: number[]; sector?: string };
type Rule = {
  id: number;
  match: { client: string; title: string; summary: string; year: number };
  alternativeSummaries: string[];
  source: { recordId: number; start: string; client: string; description: string };
  value: HistoricalCorrection;
};
type Original = { id: number; Cliente?: string; Fecha?: string; Descripcion?: string };
const originals = new Map((antecedentesReales as Original[]).map((item) => [item.id, item]));
const rules = new Map((data.entries as Rule[]).map((entry) => [entry.id, entry]));
const starts = (dates as { fechas: Record<string, { inicio: string | null }> }).fechas;
const clean = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
const identity = (value: unknown) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** The correction is valid only for the exact web record and its verified historical crosswalk. */
export function verifiedHistoricalCaseCorrection(current: HistoricalSource): HistoricalCorrection | undefined {
  const rule = rules.get(Number(current.id));
  if (!rule || current.year !== rule.match.year || clean(current.client) !== clean(rule.match.client) || clean(current.title) !== clean(rule.match.title)) return undefined;
  if (![rule.match.summary, ...rule.alternativeSummaries].some((summary) => clean(summary) === clean(current.summary))) return undefined;
  const origin = originals.get(rule.source.recordId);
  if (!origin || origin.Fecha !== rule.source.start || starts[String(current.id)]?.inicio !== rule.source.start) return undefined;
  if (identity(origin.Cliente) !== identity(rule.source.client) || identity(origin.Cliente) !== identity(current.client)) return undefined;
  if (clean(origin.Descripcion) !== clean(rule.source.description)) return undefined;
  return rule.value;
}
