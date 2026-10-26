import { addHeadingIds, normalizeBlogLead, sanitizeBlogExcerpt } from '../src/utils/blogUtils';

describe('blog editorial rendering', () => {
  test('renders Markdown headings and links while preserving fenced code literally', async () => {
    const source = [
      'Introducción del artículo.',
      '',
      '## Dónde aparece el problema',
      '',
      'La guía incluye [la documentación](https://example.com/docs).',
      '',
      '```ts',
      'const heading = "## literal dentro del ejemplo";',
      'const bold = "**sin convertir**";',
      '```',
    ].join('\n');

    const { html, headings } = await addHeadingIds(source);

    expect(html).toContain('<h2 id="donde-aparece-el-problema">Dónde aparece el problema</h2>');
    expect(html).toContain('<a href="https://example.com/docs">la documentación</a>');
    expect(html).toContain('const heading = "## literal dentro del ejemplo";');
    expect(html).toContain('const bold = "**sin convertir**";');
    expect(headings).toEqual([{ level: 2, id: 'donde-aparece-el-problema', text: 'Dónde aparece el problema' }]);
  });

  test('renders mixed HTML, Markdown lists and tables without rewriting code samples', async () => {
    const source = [
      '<p>Introducción HTML.</p>',
      '',
      '## Verificación',
      '',
      '- revisar el permiso',
      '- probar la salida',
      '',
      '| Etapa | Evidencia |',
      '| --- | --- |',
      '| Copia | Restauración |',
      '',
      '<pre><code>const marker = "## literal";\nconst value = "__unchanged__";</code></pre>',
      '',
      'Texto con código inline `**literal**`.',
    ].join('\n');

    const { html } = await addHeadingIds(source);

    expect(html).toContain('<p>Introducción HTML.</p>');
    expect(html).toContain('<h2 id="verificacion">Verificación</h2>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<table>');
    expect(html).toContain('const marker = "## literal";');
    expect(html).toContain('const value = "__unchanged__";');
    expect(html).toContain('<code>**literal**</code>');
  });

  test('repairs literal headings inside existing HTML paragraphs but leaves code text alone', async () => {
    const source = '<p>Resumen. ## Dónde aparece el problema Una empresa revisa la salida. <code>## no es heading</code></p>';
    const { html } = await addHeadingIds(source);

    expect(html).toContain('<h2 id="donde-aparece-el-problema">Dónde aparece el problema</h2>');
    expect(html).toContain('<code>## no es heading</code>');
  });

  test('keeps Markdown link labels in leads and excerpts without exposing URLs', () => {
    const cases = [
      {
        source: 'El [Informe](https://example.com/informe) cambió.',
        expected: 'El Informe cambió.',
      },
      {
        source: 'El[Informe de Pagos Minoristas de marzo](https://www.bcra.gob.ar/publicaciones/informe-de-pagos-minoristas-marzo-d',
        expected: 'El Informe de Pagos Minoristas de marzo',
      },
      {
        source: 'La[Comunicación A8425](https://www.bcra.gob.ar/archivos/Pdfs/comytexord',
        expected: 'La Comunicación A8425',
      },
    ];

    for (const { source, expected } of cases) {
      const lead = normalizeBlogLead(source);
      const excerpt = sanitizeBlogExcerpt(source, 220);
      expect(lead).toBe(expected);
      expect(excerpt).toBe(expected);
      for (const rendered of [lead, excerpt]) {
        expect(rendered).not.toMatch(/\[|\]\(|https:/i);
      }
    }
  });

  test('preserves sentence-aware lead truncation after Markdown normalization', () => {
    const source = `${'Una oración que contiene información comprobable. '.repeat(3)}${'Otra frase larga que continúa con más información técnica para superar el límite editorial. '.repeat(2)}`;
    const lead = normalizeBlogLead(source, 140);
    expect(lead).toBe('Una oración que contiene información comprobable. Una oración que contiene información comprobable.');
    expect(lead.length).toBeLessThanOrEqual(140);
  });
});
