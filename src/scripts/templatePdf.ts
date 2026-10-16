import type { Content, ContentText, TableCell, TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

const pageWidth = 595.28;
const left = 70.87;
const right = 56.69;
const contentWidth = pageWidth - left - right;
let resources: Promise<{ pdfMake: typeof import('pdfmake/build/pdfmake'); logo: string; vfs: Record<string,string>; fonts: TFontDictionary }> | undefined;

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 32768) binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
  return btoa(binary);
}

async function loadResources() {
  if (!resources) resources = (async () => {
    const { default: pdfMake } = await import('pdfmake/build/pdfmake');
    const names = ['Regular', 'SemiBold', 'RegularItalic', 'SemiBoldItalic'];
    const vfs: Record<string, string> = {};
    await Promise.all(names.map(async name => {
      const filename = `UMSans2-${name}.ttf`;
      const response = await fetch(`/fonts/um-sans/v2.0.0/${filename}`);
      if (!response.ok) throw new Error('No se pudo cargar la tipografía del PDF. Volvé a intentar.');
      vfs[filename] = base64(new Uint8Array(await response.arrayBuffer()));
    }));
    const fonts: TFontDictionary = { UM: { normal: 'UMSans2-Regular.ttf', bold: 'UMSans2-SemiBold.ttf', italics: 'UMSans2-RegularItalic.ttf', bolditalics: 'UMSans2-SemiBoldItalic.ttf' } };
    const response = await fetch('/images/brand-document.svg');
    if (!response.ok) throw new Error('No se pudo cargar la marca del documento.');
    return { pdfMake, logo: await response.text(), vfs, fonts };
  })().catch(error => { resources = undefined; throw error; });
  return resources;
}

export function inlineText(element: Element): ContentText['text'] {
  const fragments: ContentText[] = [];
  const visit = (node: Node, bold = false, italics = false) => {
    if (node.nodeType === 3) { if (node.textContent) fragments.push({ text: node.textContent, bold: bold || undefined, italics: italics || undefined }); return; }
    if (node.nodeType !== 1) return;
    const child = node as Element;
    if (child.tagName === 'BR') { fragments.push({ text: '\n' }); return; }
    if (['BUTTON', 'SCRIPT', 'STYLE', 'INPUT'].includes(child.tagName)) return;
    child.childNodes.forEach(item => visit(item, bold || ['STRONG', 'B'].includes(child.tagName), italics || ['EM', 'I'].includes(child.tagName)));
  };
  element.childNodes.forEach(node => visit(node));
  return fragments.length ? fragments : '';
}

export function tableContent(table: HTMLTableElement): Content {
  const rows = Array.from(table.rows);
  const columnCount = Math.max(...rows.map(row => Array.from(row.cells).reduce((sum, cell) => sum + cell.colSpan, 0)));
  const widths = Array.from(table.querySelectorAll<HTMLTableColElement>('col')).map(col => parseFloat(col.style.width));
  const total = widths.reduce((sum, width) => sum + width, 0);
  const body: TableCell[][] = rows.map((row, rowIndex) => {
    const result: TableCell[] = [];
    Array.from(row.cells).forEach(cell => {
      const header = cell.tagName === 'TH';
      const alignment = cell.style.textAlign === 'right' ? 'right' : cell.style.textAlign === 'center' ? 'center' : 'left';
      result.push({ text: inlineText(cell), alignment, bold: header, fillColor: header ? '#f0f0f0' : rowIndex % 2 === 0 ? '#f5f5f5' : '#ffffff', color: '#17191c', colSpan: cell.colSpan, noWrap: cell.classList.contains('number-cell') });
      for (let span = 1; span < cell.colSpan; span++) result.push({});
    });
    while (result.length < columnCount) result.push({ text: '' });
    return result;
  });
  // pdfmake widths exclude cell padding and border lines.
  const usableWidth = contentWidth - columnCount * 16 - (columnCount + 1) * 0.4;
  return {
    table: { headerRows: table.tHead ? table.tHead.rows.length : 1, dontBreakRows: true, widths: widths.length === columnCount && total > 0 ? widths.map(width => usableWidth * width / total) : Array.from({ length: columnCount }, () => '*'), body },
    layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => '#d9d9d9', vLineColor: () => '#d9d9d9', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 7, paddingBottom: () => 7 },
    fontSize: 10.5, lineHeight: 1.15, margin: [0, 10, 0, 20],
  };
}

async function imageData(image: HTMLImageElement): Promise<string> {
  if (!image.complete || !image.naturalWidth) await image.decode();
  if (/^data:image\/(png|jpeg);base64,/i.test(image.src)) return image.src;
  const canvas = image.ownerDocument.createElement('canvas');
  const ratio = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.round(image.naturalWidth * ratio);
  canvas.height = Math.round(image.naturalHeight * ratio);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo preparar una imagen para el PDF.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

export async function documentContent(main: HTMLElement): Promise<Content[]> {
  const result: Content[] = [];
  const counters = [0, 0, 0];
  let previousHeading = false;
  for (const block of Array.from(main.children)) {
    const tag = block.tagName;
    if (['H1', 'H2', 'H3', 'H4'].includes(tag)) {
      const level = Number(tag.slice(1)) - 2;
      let number = '';
      if (level >= 0) {
        counters[level]++;
        for (let index = level + 1; index < counters.length; index++) counters[index] = 0;
        number = counters.slice(0, level + 1).join('.') + '. ';
      }
      const heading: ContentText & { id?: string } = { text: [...(number ? [{ text: number }] : []), ...(inlineText(block) as ContentText[])], bold: true, fontSize: tag === 'H1' ? 22 : tag === 'H2' ? 16 : tag === 'H3' ? 13 : 12, lineHeight: 1.1, margin: [0, tag === 'H1' ? 10 : previousHeading ? 8 : tag === 'H2' ? 24 : tag === 'H3' ? 18 : 16, 0, 6], headlineLevel: level + 2, id: block.classList.contains('page-break') ? 'umsa-section-break-' + counters.join('-') : undefined };
      result.push(heading);
      previousHeading = true;
      continue;
    }
    const wasHeading = previousHeading;
    previousHeading = false;
    if (tag === 'FIGURE') {
      const image = block.querySelector<HTMLImageElement>('img');
      if (!image) continue;
      const caption = block.querySelector('figcaption');
      const percentage = parseFloat((block as HTMLElement).style.getPropertyValue('--figure-width')) || 80;
      const imageWidth = contentWidth * Math.min(percentage, 100) / 100;
      const stack: Content[] = [{ image: await imageData(image), fit: [imageWidth, 245], alignment: 'center' }];
      if (caption && caption.textContent?.trim()) stack.push({ text: inlineText(caption), fontSize: 10.5, color: '#333333', alignment: 'center', margin: [contentWidth * 0.075, 8, contentWidth * 0.075, 0] });
      result.push({ stack, unbreakable: true, margin: [0, 18, 0, 28] });
    } else if (tag === 'TABLE' || block.querySelector('table')) {
      const table = (tag === 'TABLE' ? block : block.querySelector('table')) as HTMLTableElement;
      const rendered = tableContent(table);
      if (wasHeading && table.rows.length <= 8) {
        const heading = result.pop()! as ContentText;
        // The whole stack already stays together; do not move its heading again.
        heading.headlineLevel = undefined;
        result.push({ stack: [heading, rendered], unbreakable: true });
      } else result.push(rendered);
    } else if (tag === 'P') {
      const spans = block.classList.contains('document-meta') ? Array.from(block.children) : [];
      if (spans.length === 2) result.push({ columns: [{ text: inlineText(spans[0]), width: 85, fontSize: 10, color: '#666666' }, { text: inlineText(spans[1]), width: '*' }], columnGap: 0, margin: [0, 0, 0, 8] });
      else result.push({ text: inlineText(block), fontSize: block.classList.contains('meta') ? 10 : block.classList.contains('subtitle') ? 13 : 12, color: block.classList.contains('meta') ? '#555555' : '#17191c', alignment: block.classList.contains('align-right') ? 'right' : 'left', margin: [0, parseFloat((block as HTMLElement).style.marginTop) || 0, 0, 8] });
    } else if (tag === 'UL' || tag === 'OL') {
      const items = Array.from(block.children).map(child => ({ text: inlineText(child) }));
      result.push(tag === 'UL' ? { ul: items, margin: [0, 0, 0, 16] } : { ol: items, margin: [0, 0, 0, 16] });
    }
  }
  return result;
}

export function templatePageBreak(node: { id?: string; headlineLevel?: number; startPosition: { verticalRatio: number } }, following: unknown[]): boolean {
  // Preserve section starts when a page is well underway, but avoid an almost
  // empty page when a preceding table has already moved to the next sheet.
  return Boolean((node.id?.startsWith('umsa-section-break-') && node.startPosition.verticalRatio > 0.4) || (node.headlineLevel && !following.length));
}

export async function createTemplatePdf(main: HTMLElement, templateId: string): Promise<Blob> {
  const [{ pdfMake, logo, vfs, fonts }, content] = await Promise.all([loadResources(), documentContent(main)]);
  const title = main.querySelector('h1')?.textContent || 'Documento UMSA';
  const definition: TDocumentDefinitions = {
    info: { title, author: 'ULTIMA MILLA S.A.', creator: 'Editor de plantillas UMSA' },
    pageSize: 'A4', pageMargins: [left, 88, right, 68],
    defaultStyle: { font: 'UM', fontSize: 12, color: '#17191c', lineHeight: 1.2 },
    header: () => ({ stack: [{ svg: logo, width: 153, alignment: templateId === 'membrete' ? 'left' : 'right' }, { canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentWidth, y2: 0, lineWidth: 0.6, lineColor: '#dc2626' }], margin: [0, 10, 0, 0] }], margin: [left, 40, right, 0] }),
    footer: (current, count) => ({ stack: [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentWidth, y2: 0, lineWidth: 0.4, lineColor: '#dddddd' }] }, { columns: [{ text: 'ULTIMA MILLA S.A. · ultimamilla.com.ar', width: '*' }, { text: `${current} / ${count}`, width: 40, alignment: 'right' }], fontSize: 9, color: '#666666', margin: [0, 7, 0, 0] }], margin: [left, 22, right, 0] }),
    content,
    pageBreakBefore: templatePageBreak,
  };
  return new Promise((resolve, reject) => {
    try { pdfMake.createPdf(definition, undefined, fonts, vfs).getBlob(resolve); } catch (error) { reject(error); }
  });
}
