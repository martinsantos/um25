import { excerptEditorialSentences } from '../src/utils/editorialExcerpt';

describe('editorial sentence excerpts', () => {
  test('keeps complete sentences and normalizes duplicated punctuation', () => {
    const source = [
      'Soporte IT de misión crítica para el data center provincial..',
      'Mesa de ayuda prioritaria para áreas críticas.',
      'Monitoreo 24/7 de infraestructura.',
      'Escalado jerárquico de incidentes.',
    ].join(' ');

    expect(excerptEditorialSentences(source, 176, 3)).toBe(
      'Soporte IT de misión crítica para el data center provincial. Mesa de ayuda prioritaria para áreas críticas. Monitoreo 24/7 de infraestructura.',
    );
  });

  test('uses a word-boundary fallback when the first sentence exceeds the limit', () => {
    const excerpt = excerptEditorialSentences(
      'Infraestructura documentada para una operación distribuida con múltiples dependencias críticas y ventanas de intervención controladas.',
      72,
    );

    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(73);
    expect(excerpt).not.toMatch(/\s…$/);
  });
});
