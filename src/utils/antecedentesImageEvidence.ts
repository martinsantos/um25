import { BASE_POSTER, posterForAntecedente } from '../data/cine/posters';
import { curateCatalogImage } from '../components/proto/catalogEditorial';
import type { Story } from '../components/proto/isoData';
import { getAntecedenteThumb } from '../lib/um26-data/images';
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
// La vista de respaldo conserva la misma prioridad editorial de la ficha.
const generatedMap: Record<string, string> = Object.fromEntries(
  antecedentes.map((item) => [String(item.id), getEvidenceImagePath(item)]),
);

function cleanOptionalText(value: string | null | undefined): string | null {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function getEvidenceImagePath(item: SnapshotCase): string {
  const current = getAntecedenteThumb(item.id) || getAntecedenteThumb(item.original_id) || posterForAntecedente(item.id) || BASE_POSTER;
  return curateCatalogImage(item.id, current);
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
  return buildAntecedentesImageEvidenceCoverage(getAntecedentesImageEvidenceEntries(), antecedentes.length);
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
  const generatedAiImages = entries.filter((entry) => entry.imagePath.startsWith('/images/antecedentes/generated/')).length;
  const contextualPhotographs = entries.filter((entry) => entry.imagePath.startsWith('/images/photography/')).length;
  const missingImages = Math.max(0, totalAntecedentes - entries.length);

  return {
    associatedImages: entries.length,
    generatedAiImages,
    contextualPhotographs,
    otherImages: entries.length - generatedAiImages - contextualPhotographs,
    missingImages,
    // Compatibility: these historical names count all image types, not just AI.
    generatedImages: entries.length,
    totalAntecedentes,
    missingGeneratedImages: missingImages,
    coverageRatio: Number(coverageRatio.toFixed(4)),
  };
}

/** Usar la misma presentación que la ficha evita publicar otra imagen o una URL redirigida. */
export function buildAntecedentesImageEvidenceEntriesFromStories(stories: Story[]): AntecedenteImageEvidenceEntry[] {
  return stories.flatMap((story) => {
    const imageUrl = publicImageUrl(story.image);
    if (!story.title || !imageUrl) return [];
    return [{
      id: story.id,
      title: story.title,
      pageUrl: canonicalUrl(story.href),
      imageUrl,
      imagePath: story.image,
      client: cleanOptionalText(story.client),
      sector: cleanOptionalText(story.sector),
      date: cleanOptionalText(story.cierre || story.inicio),
    }];
  }).sort((a, b) => a.id - b.id);
}

export async function getAntecedentesImageEvidenceEntriesFromDirectus(): Promise<AntecedenteImageEvidenceEntry[]> {
  return (await getAntecedentesImageEvidenceDatasetFromDirectus()).entries;
}

export async function getAntecedentesImageEvidenceCoverageFromDirectus() {
  return (await getAntecedentesImageEvidenceDatasetFromDirectus()).coverage;
}

export async function getAntecedentesImageEvidenceDatasetFromDirectus() {
  const { loadStories } = await import('../components/proto/isoData');
  const { stories } = await loadStories();
  const entries = buildAntecedentesImageEvidenceEntriesFromStories(stories);
  return {
    entries,
    coverage: buildAntecedentesImageEvidenceCoverage(entries, stories.length),
  };
}
