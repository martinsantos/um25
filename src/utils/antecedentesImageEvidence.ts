import generatedAntecedenteImageMap from '../data/antecedentes-generated-image-map.json';
import antecedentesSnapshot from '../data/snapshots/antecedentes.json';
import { canonicalUrl, publicImageUrl } from './seoUrl';
import { generateSlug } from './slugUtils.js';

type SnapshotRoot<T> = { data?: T[] } | T[];

interface SnapshotCase {
  id: number;
  Titulo: string;
  Descripcion?: string;
  Cliente?: string;
  Area?: string;
  Fecha?: string;
  Imagen?: string | { id?: string; directus_files_id?: string } | null;
  original_id?: number | string | null;
}

export interface AntecedenteImageEvidenceEntry {
  id: number;
  title: string;
  pageUrl: string;
  imageUrl: string;
  imagePath: string;
  client: string | null;
  sector: string | null;
  date: string | null;
}

function snapshotData<T>(snapshot: SnapshotRoot<T>): T[] {
  return Array.isArray(snapshot) ? snapshot : snapshot.data || [];
}

const antecedentes = snapshotData<SnapshotCase>(antecedentesSnapshot as SnapshotRoot<SnapshotCase>);
const antecedentesById = new Map(antecedentes.map((item) => [Number(item.id), item]));
const generatedMap = generatedAntecedenteImageMap as Record<string, string>;
const directusImageVersion = '20260201';

function cleanOptionalText(value: string | null | undefined): string | null {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function getDirectusImageId(image: SnapshotCase['Imagen']): string {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.id || image.directus_files_id || '';
}

function getEvidenceImagePath(item: SnapshotCase): string {
  const generatedImage = generatedMap[String(item.id)] || generatedMap[String(item.original_id || '')] || '';
  if (generatedImage) return generatedImage;

  const directusImageId = getDirectusImageId(item.Imagen);
  if (directusImageId) return `/assets/${directusImageId}?v=${directusImageVersion}`;
  return '';
}

export function getAntecedentesImageEvidenceEntries(): AntecedenteImageEvidenceEntry[] {
  return Object.entries(generatedMap)
    .map(([rawId, imagePath]) => {
      const id = Number(rawId);
      const item = antecedentesById.get(id);
      const imageUrl = publicImageUrl(imagePath);

      if (!Number.isFinite(id) || !item || !item.Titulo || !imageUrl) return null;

      return {
        id,
        title: item.Titulo,
        pageUrl: canonicalUrl(`/antecedentes/${id}/${generateSlug(item.Titulo)}`),
        imageUrl,
        imagePath,
        client: cleanOptionalText(item.Cliente),
        sector: cleanOptionalText(item.Area),
        date: cleanOptionalText(item.Fecha),
      };
    })
    .filter((entry): entry is AntecedenteImageEvidenceEntry => Boolean(entry))
    .sort((a, b) => a.id - b.id);
}

export function getAntecedentesImageEvidenceCoverage() {
  const entries = getAntecedentesImageEvidenceEntries();
  const totalAntecedentes = antecedentes.length;
  const coverageRatio = totalAntecedentes > 0 ? entries.length / totalAntecedentes : 0;

  return {
    generatedImages: entries.length,
    totalAntecedentes,
    missingGeneratedImages: Math.max(0, totalAntecedentes - entries.length),
    coverageRatio: Number(coverageRatio.toFixed(4)),
  };
}

export function buildAntecedentesImageEvidenceEntries(items: SnapshotCase[]): AntecedenteImageEvidenceEntry[] {
  return items
    .map((item) => {
      const id = Number(item.id);
      const imagePath = getEvidenceImagePath(item);
      const imageUrl = publicImageUrl(imagePath);

      if (!Number.isFinite(id) || !item.Titulo || !imageUrl) return null;

      return {
        id,
        title: item.Titulo,
        pageUrl: canonicalUrl(`/antecedentes/${id}/${generateSlug(item.Titulo)}`),
        imageUrl,
        imagePath,
        client: cleanOptionalText(item.Cliente),
        sector: cleanOptionalText(item.Area),
        date: cleanOptionalText(item.Fecha),
      };
    })
    .filter((entry): entry is AntecedenteImageEvidenceEntry => Boolean(entry))
    .sort((a, b) => a.id - b.id);
}

export function buildAntecedentesImageEvidenceCoverage(
  entries: AntecedenteImageEvidenceEntry[],
  totalAntecedentes: number,
) {
  const coverageRatio = totalAntecedentes > 0 ? entries.length / totalAntecedentes : 0;

  return {
    generatedImages: entries.length,
    totalAntecedentes,
    missingGeneratedImages: Math.max(0, totalAntecedentes - entries.length),
    coverageRatio: Number(coverageRatio.toFixed(4)),
  };
}

export async function getAntecedentesImageEvidenceEntriesFromDirectus(): Promise<AntecedenteImageEvidenceEntry[]> {
  const { getAllAntecedentes } = await import('../lib/directus');
  const items = await getAllAntecedentes();
  return buildAntecedentesImageEvidenceEntries(items as SnapshotCase[]);
}

export async function getAntecedentesImageEvidenceCoverageFromDirectus() {
  const { getAllAntecedentes } = await import('../lib/directus');
  const items = await getAllAntecedentes();
  const entries = buildAntecedentesImageEvidenceEntries(items as SnapshotCase[]);
  return buildAntecedentesImageEvidenceCoverage(entries, items.length);
}

export async function getAntecedentesImageEvidenceDatasetFromDirectus() {
  const { getAllAntecedentes } = await import('../lib/directus');
  const items = await getAllAntecedentes();
  const entries = buildAntecedentesImageEvidenceEntries(items as SnapshotCase[]);
  return {
    entries,
    coverage: buildAntecedentesImageEvidenceCoverage(entries, items.length),
  };
}
