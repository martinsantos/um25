import { cleanMain } from '../src/scripts/templateEditor';
import { documentContent, inlineText, tableContent, templatePageBreak } from '../src/scripts/templatePdf';

describe('documentos editables y PDF', () => {
  test('un editable importado conserva texto y transparencia sin scripts ni recursos externos', () => {
    const result = cleanMain('<main><h2><span>Alcance</span></h2><p onclick="alert(1)" style="text-align:right;background:url(https://example.com/track)">Contenido</p><script>alert(1)</script><iframe src="https://example.com"></iframe><img src="https://example.com/track"><figure><img src="data:image/png;base64,AA=="><button>Cambiar imagen</button><figcaption>Producto</figcaption></figure></main>');
    const doc = new DOMParser().parseFromString(result,'text/html');
    expect(doc.body.textContent).toBe('AlcanceContenidoProducto');
    expect(doc.querySelector('script,iframe,button,[onclick]')).toBeNull();
    expect(doc.querySelectorAll('img')).toHaveLength(1);
    expect(doc.querySelector('img')!.getAttribute('src')).toBe('data:image/png;base64,AA==');
    expect(doc.querySelector('p')!.getAttribute('style')).toBe('text-align: right;');
  });
  test('los fragmentos comunes heredan el peso del título o de la cabecera', () => {
    const p = document.createElement('p');p.innerHTML = 'Texto <strong>fuerte</strong> y <em>cursiva</em>';
    const parts = inlineText(p) as Array<{text:string;bold?:boolean;italics?:boolean}>;
    expect(parts[0].bold).toBeUndefined();
    expect(parts.find(part=>part.text==='fuerte')!.bold).toBe(true);
    expect(parts.find(part=>part.text==='cursiva')!.italics).toBe(true);
  });
  test('los títulos llevan punto final y el título de una tabla corta viaja junto a ella', async () => {
    const main = document.createElement('main');main.innerHTML = '<h1>Oferta</h1><h2><span>Solución</span></h2><p>Detalle</p><h3><span>Entregables</span></h3><h4><span>Verificación</span></h4><table><thead><tr><th>Concepto</th></tr></thead><tbody><tr><td>Pruebas</td></tr></tbody></table><h2><span>Condiciones</span></h2>';
    const content = await documentContent(main) as Array<Record<string,any>>;
    const text = (block:Record<string,any>) => block.text.map((part:{text:string})=>part.text).join('');
    expect(text(content[1])).toBe('1. Solución');
    expect(text(content[3])).toBe('1.1. Entregables');
    expect(content[4].unbreakable).toBe(true);
    expect(text(content[4].stack[0])).toBe('1.1.1. Verificación');
    expect(content[4].stack[0].headlineLevel).toBeUndefined();
    expect(content[4].stack[1].table.body[1][0].text[0].text).toBe('Pruebas');
    expect(text(content[5])).toBe('2. Condiciones');
  });
  test('un corte de sección evita una página casi vacía y conserva los títulos con contenido', () => {
    const section = {id:'umsa-section-break-4-0-0',headlineLevel:2,startPosition:{verticalRatio:0.2}};
    expect(templatePageBreak(section,[{}])).toBe(false);
    expect(templatePageBreak({...section,startPosition:{verticalRatio:0.8}},[{}])).toBe(true);
    expect(templatePageBreak(section,[])).toBe(true);
  });
  test('las cabeceras de tabla son claras, los importes conservan alineación y hay aire interior', () => {
    const host = document.createElement('div');host.innerHTML = '<table><colgroup><col style="width:60%"><col style="width:40%"></colgroup><thead><tr><th>Concepto</th><th style="text-align:right">Importe</th></tr></thead><tbody><tr><td>Servicio</td><td class="number-cell" style="text-align:right">1.234,56</td></tr></tbody></table>';
    const content = tableContent(host.querySelector('table')!) as any;
    expect(content.table.body[0][0].fillColor).toBe('#f0f0f0');
    expect(content.table.body[0][0].color).toBe('#17191c');
    expect(content.table.body[0][0].bold).toBe(true);
    expect(content.table.body[1][1].alignment).toBe('right');
    expect(content.table.body[1][1].noWrap).toBe(true);
    expect(content.layout.paddingLeft()).toBeGreaterThanOrEqual(8);
    expect(content.layout.paddingTop()).toBeGreaterThanOrEqual(7);
  });
});

describe('guardado local', () => {
  const original = globalThis.indexedDB;
  afterEach(() => { globalThis.indexedDB = original; jest.resetModules(); });
  const setup = async () => {
    const request:Record<string,any> = {};
    const putRequest:Record<string,any> = {result:'draft-id'};
    const tx:Record<string,any> = {objectStore:()=>({put:()=>putRequest})};
    request.result = {transaction:()=>tx};
    globalThis.indexedDB = {open:()=>request} as unknown as IDBFactory;
    const {saveDraft} = await import('../src/scripts/templateStorage');
    const pending = saveDraft({id:'draft-id',html:'<p>Borrador</p>',updated:1});
    request.onsuccess();
    await Promise.resolve();
    return {pending,tx,putRequest};
  };
  test('no informa guardado antes del commit de la transacción', async () => {
    const {pending,tx,putRequest} = await setup();let saved=false;
    void pending.then(()=>{saved=true;});
    putRequest.onsuccess?.();await Promise.resolve();expect(saved).toBe(false);
    tx.oncomplete();await expect(pending).resolves.toBe('draft-id');
  });
  test('un aborto por falta de espacio rechaza el guardado aunque el put haya terminado', async () => {
    const {pending,tx,putRequest} = await setup();
    putRequest.onsuccess?.();tx.error=new DOMException('No space','QuotaExceededError');
    tx.onabort();await expect(pending).rejects.toThrow('No space');
  });
});
