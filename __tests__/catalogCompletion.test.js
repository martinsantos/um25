const { documentedCompletion } = require('../src/components/proto/catalogCompletion.ts');

const current = {
  client: 'Bodega Los Andes',
  title: 'Ampliación de depósito',
  summary: 'Redes y control para la nueva nave',
  year: 2024,
};

function completion(overrides = {}) {
  return {
    id: 42,
    match: { ...current },
    sector: 'bodegas',
    services: ['101', '108'],
    sources: [
      { field: 'sector', file: 'catalogo.pdf', recordId: 42, quote: 'Bodega Los Andes — ampliación' },
      { field: 'services', file: 'catalogo.pdf', recordId: 42, quote: 'Cableado y cámaras' },
    ],
    ...overrides,
  };
}

describe('documentedCompletion', () => {
  test('accepts the phone-support title when its source and client still match', () => {
    const entries = require('../src/data/propuesta/catalog-completions.json').entries;
    const record = {
      client: 'Municipalidad de Guaymallén',
      title: 'Soporte de Infraestructura IT de Alta Disponibilidad - Municipalidad Guaymallén - Abril 2025',
      summary: 'Soporte de telefonía - Municipalidad de Guaymallén',
      year: 2025,
    };
    expect(documentedCompletion(3079, record, entries)?.title).toBe('Soporte de telefonía');
  });

  test('returns a documented entry when its full metadata key matches', () => {
    const entry = completion();

    expect(documentedCompletion(42, current, [entry])).toBe(entry);
  });

  test('normalizes whitespace, including HTML whitespace entities, without changing text meaning', () => {
    const entry = completion({
      match: {
        ...current,
        client: ' Bodega&nbsp;Los   Andes ',
        title: 'Ampliación\n de depósito',
        summary: 'Redes y control para la nueva nave',
      },
    });

    expect(documentedCompletion(42, current, [entry])).toBe(entry);
    expect(
      documentedCompletion(42, { ...current, title: 'Ampliacion de depósito' }, [entry]),
    ).toBeUndefined();
  });

  test.each([
    ['client', 'Bodega Los Andes II'],
    ['title', 'Nuevo título'],
    ['summary', 'Resumen actualizado'],
    ['year', 2025],
  ])('rejects a changed %s so evidence cannot cross records', (field, value) => {
    const entry = completion();

    expect(documentedCompletion(42, { ...current, [field]: value }, [entry])).toBeUndefined();
  });

  test.each(['Cliente Confidencial', 'Cliente reservado', 'Reservado', 'sincliente', 'Sin cliente']) (
    'rejects anonymized client metadata (%s)',
    (client) => {
      const entry = completion({ match: { ...current, client } });

      expect(documentedCompletion(42, { ...current, client }, [entry])).toBeUndefined();
    },
  );

  test('allows an already-anonymized current record only with same-record, current-text quotes', () => {
    const anonymous = { ...current, client: 'Cliente Confidencial' };
    const entry = completion({
      match: anonymous,
      sources: [
        { field: 'sector', file: 'catalogo.pdf', recordId: 42, quote: 'Ampliación de depósito' },
        { field: 'services', file: 'catalogo.pdf', recordId: 42, quote: 'Redes y control' },
      ],
    });

    expect(documentedCompletion(42, anonymous, [entry])).toBe(entry);
  });

  test.each([
    ['historical quote absent from current text', 'Caso histórico: Bodega Los Andes', 42],
    ['quote absent from both current title and summary', 'Archivo de otra obra', 42],
    ['quote spanning the current title and summary boundary', 'depósito Redes', 42],
    ['quote attributed to another record', 'Ampliación de depósito', 7],
  ])('rejects anonymized completion with %s', (_reason, quote, recordId) => {
    const anonymous = { ...current, client: 'Cliente Confidencial' };
    const entry = completion({
      match: anonymous,
      sources: [
        { field: 'sector', file: 'catalogo.pdf', recordId, quote },
        { field: 'services', file: 'catalogo.pdf', recordId: 42, quote: 'Redes y control' },
      ],
    });

    expect(documentedCompletion(42, anonymous, [entry])).toBeUndefined();
  });

  test('does not allow switching a named current client to anonymous evidence', () => {
    const entry = completion({ match: { ...current, client: 'Cliente Confidencial' } });

    expect(documentedCompletion(42, current, [entry])).toBeUndefined();
  });

  test('rejects entries without evidence for every mutable field present', () => {
    const entry = completion({ sources: [completion().sources[0]] });

    expect(documentedCompletion(42, current, [entry])).toBeUndefined();
    expect(documentedCompletion(42, current, [completion({ sources: [] })])).toBeUndefined();
  });

  test('rejects invalid allowlist values and HTML in text fields', () => {
    expect(documentedCompletion(42, current, [completion({ sector: 'software' })])).toBeUndefined();
    expect(documentedCompletion(42, current, [completion({ services: ['109'] })])).toBeUndefined();
    expect(documentedCompletion(42, current, [completion({ title: '<strong>Depósito</strong>' })])).toBeUndefined();
    expect(documentedCompletion(42, current, [completion({ sources: [
      { field: 'sector', file: 'catalogo.pdf', recordId: 42, quote: '   ' },
      ...completion().sources.slice(1),
    ] })])).toBeUndefined();
  });

  test('does not mutate the current metadata, entries, or nested evidence', () => {
    const entry = completion();
    const input = { current, entries: [entry] };
    const before = JSON.parse(JSON.stringify(input));

    expect(documentedCompletion(42, current, input.entries)).toBe(entry);
    expect(input).toEqual(before);
  });
});
