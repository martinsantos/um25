const fs = require('fs');
const path = require('path');

describe('Blog mixed Markdown rendering contracts', () => {
  test('Markdown renderer parses mixed Markdown blocks with inline HTML', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/utils/editorialContent.ts'), 'utf8');

    expect(source).toContain('const hasHtml = HTML_TAG_RE.test(cleaned);');
    expect(source).toContain('const hasMarkdownBlocks = /(^|\\n)\\s{0,3}(#{1,6}\\s+|[-*+]\\s+|\\d+\\.\\s+)/m.test(cleaned);');
    expect(source).toContain('if (hasHtml && !hasMarkdownBlocks)');
    expect(source).toContain('.use(remarkParse)');
    expect(source.indexOf('if (hasHtml && !hasMarkdownBlocks)')).toBeLessThan(source.indexOf('.use(remarkParse)'));
  });

  test('renderer repairs literal Markdown headings already compacted inside HTML paragraphs', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/utils/editorialContent.ts'), 'utf8');

    expect(source).toContain('function fixLiteralMarkdownHeadingsInParagraph');
    expect(source).toContain('headingRegex');
    expect(source).toContain('|<a\\b)');
    expect(source).toContain('htmlBlockFromLiteralMarkdown');
    expect(source).toContain('.replace(/<p>([\\s\\S]*?)<\\/p>/gi');
    expect(source).toContain('return `<ul>${items.map((item) => `<li>${item}</li>`).join(\'\')}</ul>`;');
  });
});
