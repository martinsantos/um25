import { buildAntecedentesImageEvidenceCoverage, buildAntecedentesImageEvidenceEntriesFromStories } from '../src/utils/antecedentesImageEvidence';
import type { Story } from '../src/components/proto/isoData';

test('el índice de imágenes conserva la imagen y URL de la ficha presentada', () => {
  const story = {
    id: 3068,
    title: 'Fibra óptica',
    href: '/antecedentes/3068/ruta-canonica',
    image: '/images/antecedentes/generated/lote_001/imagen.webp',
    client: 'Cliente',
    sector: 'Aeropuertos',
    inicio: '2025-01-01',
  } as Story;
  const [entry] = buildAntecedentesImageEvidenceEntriesFromStories([story]);
  expect(entry?.imagePath).toBe(story.image);
  expect(entry?.imageUrl).toBe(`https://www.ultimamilla.com.ar${story.image}`);
  expect(entry?.pageUrl).toBe(`https://www.ultimamilla.com.ar${story.href}`);
  expect(entry?.date).toBe(story.inicio);
});

test('no publica una imagen de ficha ausente', () => {
  expect(buildAntecedentesImageEvidenceEntriesFromStories([{ id: 1, title: 'Sin imagen', image: '', href: '/antecedentes/1/a' } as Story])).toEqual([]);
});

test('distingue imágenes de IA, fotografías y otros recursos sin alterar la cobertura', () => {
  const stories = [
    { id: 1, title: 'IA', image: '/images/antecedentes/generated/lote_001/a.webp', href: '/antecedentes/1/a' },
    { id: 2, title: 'Foto', image: '/images/photography/b.webp', href: '/antecedentes/2/b' },
    { id: 3, title: 'Dibujo', image: '/cine/iso/site-a.svg', href: '/antecedentes/3/c' },
  ] as Story[];
  const entries = buildAntecedentesImageEvidenceEntriesFromStories(stories);
  expect(buildAntecedentesImageEvidenceCoverage(entries, 4)).toMatchObject({
    associatedImages: 3, generatedAiImages: 1, contextualPhotographs: 1, otherImages: 1,
    totalAntecedentes: 4, missingImages: 1, coverageRatio: 0.75,
  });
});
