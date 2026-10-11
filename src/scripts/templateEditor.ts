import DOMPurify from 'dompurify';
import { brandTemplates, findTemplate, editorLink, templateBase, templateLibrary, type BrandTemplate } from '../data/brandTemplates';
import { listPdfs, readDraft, removeDraft, removePdf, saveDraft, savePdf } from './templateStorage';

const editorCss = `
body{margin:0;background:#fff}.toolbar{display:none!important}.paper{box-shadow:none;margin:0;width:100%;max-width:none;padding:38px 42px 48px;min-height:0}
.brand{position:static!important;inset:auto!important;margin:0 0 32px}.brand img{max-width:100%}main{overflow-wrap:anywhere}
[contenteditable]{outline:none;border-radius:0}[contenteditable]:focus{background:#fffbe7;box-shadow:0 0 0 2px #c7ad41}
h2,h3,h4,p,td,th,figcaption{cursor:text}.figure-replace{display:inline-block!important;margin-top:12px;font:inherit;font-size:16px;border:1px solid #bbb;background:white;padding:7px 10px;cursor:pointer}
figure{position:relative;margin:32px 0 48px}figure img{display:block;margin:auto;max-width:100%;height:auto;object-fit:contain}figcaption{margin-top:12px;min-height:1.4em}
.table-scroll{overflow-x:auto}table{width:100%}th,td{padding:12px 14px}th{background:#f0f0f0;color:#17191c}
@media(max-width:650px){.paper{padding:24px 20px 40px}main{font-size:20px}h1{font-size:30px}h2{font-size:26px}h3{font-size:23px}h4{font-size:21px}.document-meta{display:block}.document-meta span:first-child{display:block;margin-bottom:4px}th,td{padding:10px;font-size:16px}.brand{margin-bottom:28px}}
@media print{.figure-replace{display:none!important}.paper{padding:0;box-shadow:none}[contenteditable]:focus{background:transparent;box-shadow:none}figure{break-inside:avoid}}
`;

export function cleanMain(html: string): string {
  const cleaned = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['main','h1','h2','h3','h4','p','span','strong','b','em','i','br','ul','ol','li','figure','figcaption','img','div','table','colgroup','col','thead','tbody','tfoot','tr','th','td'],
    ALLOWED_ATTR: ['class','style','src','alt','colspan','rowspan','width','height'],
    ALLOW_DATA_ATTR: false, ADD_FORBID_CONTENTS: ['button'],
  });
  const parsed = new DOMParser().parseFromString(cleaned, 'text/html');
  parsed.querySelectorAll<HTMLElement>('[style]').forEach(element => {
    const original = element.style;
    const safe = document.createElement('span').style;
    for (const name of ['text-align', 'margin-top', 'width', '--figure-width']) {
      const value = original.getPropertyValue(name);
      if (value && /^(left|right|center|[\d.]+(?:px|pt|%|mm)?)$/.test(value)) safe.setProperty(name, value);
    }
    element.setAttribute('style', safe.cssText);
  });
  parsed.querySelectorAll<HTMLImageElement>('img').forEach(image => {
    if (!/^data:image\/(png|jpeg|webp);base64,[a-z\d+/=\s]+$/i.test(image.getAttribute('src') || '')) image.remove();
  });
  return parsed.querySelector('main')?.innerHTML || parsed.body.innerHTML;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function initTemplateEditor() {
  const root = document.querySelector<HTMLElement>('#um-template-editor');
  if (!root || root.dataset.editorReady) return;
  root.dataset.editorReady = 'true';
  const controller = new AbortController();
  const signal = controller.signal;
  const node = <T extends HTMLElement>(id: string) => root.querySelector<T>('#' + id)!;
  const frame = node<HTMLIFrameElement>('te-document');
  const status = node('te-status');
  const pdfDialog = node<HTMLDialogElement>('te-pdfs');
  const pdfList = node('te-pdf-list');
  const select = node<HTMLSelectElement>('te-template-select');
  const variant = node<HTMLSelectElement>('te-variant');
  const imageInput = document.createElement('input');
  imageInput.type = 'file'; imageInput.accept = 'image/png,image/jpeg,image/webp'; imageInput.hidden = true;
  root.append(imageInput);
  let current: BrandTemplate = brandTemplates[0];
  let example = false, loading = false, generating = false, dirty = false;
  let styles = '', brand = '', lastBlock: Element | undefined, replacingImage: HTMLElement | undefined;
  let resize: ResizeObserver | undefined, saveTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingSave: Promise<unknown> = Promise.resolve();
  const archiveUrls: string[] = [];
  const documentMain = () => frame.contentDocument?.querySelector<HTMLElement>('main');
  const draftId = () => current.id + (example ? ':example' : ':blank');
  const setStatus = (message: string, error = false) => { status.textContent = message; status.dataset.error = String(error); };
  const setEnabled = () => {
    const editable = current.primary === 'DOCX' && !loading && !generating && Boolean(documentMain());
    ['te-generate-pdf', 'te-save-html', 'te-print'].forEach(id => { node<HTMLButtonElement>(id).disabled = !editable; });
    root.querySelectorAll<HTMLButtonElement>('[data-add-block]').forEach(button => { button.disabled = !editable; });
    select.disabled = loading || generating; variant.disabled = loading || generating;
    node<HTMLButtonElement>('te-reset-document').disabled = loading || generating;
  };
  const flush = async () => {
    clearTimeout(saveTimer);
    if (!dirty || current.primary !== 'DOCX' || !documentMain()) { await pendingSave; return; }
    const id = draftId(), html = cleanMain(documentMain()!.innerHTML);
    dirty = false;
    pendingSave = pendingSave.catch(() => undefined).then(() => saveDraft({ id, html, updated: Date.now() }));
    try { await pendingSave; if (!dirty) setStatus('Borrador guardado en este navegador.'); }
    catch (error) { dirty = true; setStatus('No se pudo guardar. Descargá el editable antes de cambiar de documento.', true); throw error; }
    if (dirty) await flush();
  };
  const changed = () => {
    dirty = true; setStatus('Guardando borrador…'); clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { void flush().catch(() => undefined); }, 600);
  };
  const syncHeight = () => {
    const doc = frame.contentDocument;
    if (doc) frame.style.height = Math.max(500, doc.body.scrollHeight + 4) + 'px';
  };
  const makeEditable = () => {
    const doc = frame.contentDocument!;
    const main = doc.querySelector<HTMLElement>('main')!;
    main.querySelectorAll<HTMLElement>('h1 > span,h2 > span,h3 > span,h4 > span,p:not(.document-meta),.document-meta > span:last-child,th,td,figcaption,li').forEach(element => {
      element.setAttribute('contenteditable', 'plaintext-only'); element.setAttribute('spellcheck', 'true');
      element.setAttribute('aria-label', element.closest('th,td') ? 'Celda editable' : 'Texto editable');
    });
    main.querySelectorAll<HTMLElement>('h1,h2,h3,h4').forEach(heading => {
      if (!heading.querySelector('span')) { const span = doc.createElement('span'); span.innerHTML = heading.innerHTML; heading.replaceChildren(span); span.setAttribute('contenteditable','plaintext-only'); span.setAttribute('aria-label','Título editable'); }
    });
    main.querySelectorAll<HTMLElement>('figure').forEach(figure => {
      if (!figure.querySelector('figcaption')) { const caption = doc.createElement('figcaption'); caption.setAttribute('contenteditable','plaintext-only'); caption.setAttribute('aria-label','Comentario opcional de imagen'); figure.append(caption); }
      if (!figure.querySelector('button')) { const button = doc.createElement('button'); button.type = 'button'; button.className = 'figure-replace'; button.textContent = 'Cambiar imagen'; figure.append(button); }
    });
    syncHeight();
  };
  const showDocument = async (html: string) => {
    resize?.disconnect();
    await new Promise<void>(resolve => {
      frame.addEventListener('load', () => resolve(), { once: true });
      frame.srcdoc = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style><style>${editorCss}</style></head><body><div class="paper">${brand}<main>${cleanMain(html)}</main></div></body></html>`;
    });
    if (signal.aborted) return;
    makeEditable();
    const doc = frame.contentDocument!;
    doc.addEventListener('input', changed, { signal });
    doc.addEventListener('focusin', event => {
      let target = event.target as Element | null;
      while (target?.parentElement && target.parentElement.tagName !== 'MAIN') target = target.parentElement;
      lastBlock = target?.parentElement?.tagName === 'MAIN' ? target : undefined;
    }, { signal });
    doc.addEventListener('click', event => {
      const button = (event.target as Element).closest('.figure-replace');
      if (button) { replacingImage = button.closest('figure') as HTMLElement; imageInput.click(); }
    }, { signal });
    resize = new ResizeObserver(syncHeight); resize.observe(doc.body);
    await doc.fonts.ready; syncHeight();
  };
  const updateLinks = () => {
    const googleUrl = example && 'googleSampleUrl' in current ? current.googleSampleUrl : current.googleUrl;
    const google = node<HTMLAnchorElement>('te-google-link');
    google.href = googleUrl; google.textContent = `Abrir en Google ${current.primary === 'XLSX' ? 'Sheets' : 'Docs'} ↗`;
    node<HTMLAnchorElement>('te-library-link').href = templateLibrary + '#' + current.id;
    select.value = current.id; variant.value = example ? 'example' : 'blank';
    node('te-document-title').textContent = current.title; node('te-document-purpose').textContent = current.purpose;
    node('te-variant-label').hidden = current.id !== 'oferta-completa';
    root.querySelectorAll<HTMLAnchorElement>('[data-editor-choice]').forEach(link => {
      if (link.dataset.editorChoice === current.id) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
  };
  const loadDocument = async (target: BrandTemplate, withExample: boolean, updateHistory: boolean) => {
    if (loading || generating) return;
    loading = true; setEnabled(); setStatus('Abriendo plantilla…');
    try {
      await flush();
      // Fetch before replacing the current draft, so a network error cannot discard edits.
      let source: Document | undefined, draft: Awaited<ReturnType<typeof readDraft>>;
      const nextExample = withExample && target.id === 'oferta-completa';
      if (target.primary === 'DOCX') {
        const filename = nextExample && 'sample' in target ? target.sample : target.id;
        const response = await fetch(`${templateBase}/${filename}.html`, { signal });
        if (!response.ok) throw new Error('No se pudo cargar la plantilla. Volvé a intentar.');
        source = new DOMParser().parseFromString(await response.text(), 'text/html');
        if (!source.querySelector('main')) throw new Error('La plantilla no contiene un documento editable.');
        try { draft = await readDraft(target.id + (nextExample ? ':example' : ':blank')); }
        catch { setStatus('El guardado local no está disponible. Descargá el editable para conservar tus cambios.',true); }
      }
      current = target; example = nextExample; lastBlock = undefined; dirty = false; updateLinks();
      const isSheet = current.primary === 'XLSX';
      frame.hidden = isSheet; node('te-sheet-entry').hidden = !isSheet;
      ['te-insert','te-edit-hint'].forEach(id => { node(id).hidden = isSheet; });
      root.querySelector<HTMLElement>('.te-actions')!.hidden = isSheet;
      node('te-import-html').closest<HTMLElement>('label')!.hidden = isSheet;
      node('te-reset-document').hidden = isSheet;
      if (isSheet) {
        resize?.disconnect();
        node('te-sheet-description').textContent = current.id === 'presupuesto-interno' ? 'El cotizador conserva sus ocho hojas: guía, parametrización, cuadro de resultado, dimensionamiento, oferta, materiales, PD y Hoja1.' : current.description;
        node<HTMLAnchorElement>('te-sheet-google').href = current.googleUrl;
        node<HTMLAnchorElement>('te-sheet-download').href = `${templateBase}/${current.id}.xlsx`;
        node<HTMLAnchorElement>('te-sheet-pdf').href = `${templateBase}/${current.id}.pdf`;
        setStatus('Creá una copia propia en Google Sheets para empezar a cotizar.');
      } else {
        styles = Array.from(source!.querySelectorAll('style')).map(style => style.textContent).join('\n');
        brand = source!.querySelector('.brand')?.outerHTML || '';
        await showDocument(draft?.html || source!.querySelector('main')!.innerHTML);
        setStatus(draft ? 'Tu borrador fue recuperado de este navegador.' : 'Listo para editar. Tus cambios se guardan en este navegador.');
      }
      if (updateHistory) history.pushState(null,'',editorLink(current.id, example));
    } catch (error) {
      if (!signal.aborted) setStatus(error instanceof Error ? error.message : 'No se pudo abrir el documento.',true);
      updateLinks();
    } finally { loading = false; setEnabled(); }
  };
  root.querySelectorAll<HTMLAnchorElement>('[data-editor-choice]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); void loadDocument(findTemplate(link.dataset.editorChoice),false,true);
  }, { signal }));
  select.addEventListener('change', () => { void loadDocument(findTemplate(select.value),false,true); }, { signal });
  variant.addEventListener('change', () => { void loadDocument(current,variant.value === 'example',true); }, { signal });
  window.addEventListener('popstate', () => { const url = new URL(location.href); void loadDocument(findTemplate(url.searchParams.get('documento')),url.searchParams.get('vista') === 'ejemplo',false); }, { signal });

  const insert = (block: Element) => {
    const main = documentMain()!;
    if (lastBlock?.parentElement === main) lastBlock.after(block); else main.append(block);
    lastBlock = block; makeEditable(); changed();
    block.querySelector<HTMLElement>('[contenteditable]')?.focus();
  };
  root.querySelectorAll<HTMLButtonElement>('[data-add-block]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.addBlock === 'figure') { replacingImage = undefined; imageInput.click(); return; }
    const doc = frame.contentDocument!, kind = button.dataset.addBlock!;
    if (kind === 'table') {
      const wrapper = doc.createElement('div'); wrapper.className = 'table-scroll';
      wrapper.innerHTML = '<table><colgroup><col style="width:50%"><col style="width:50%"></colgroup><thead><tr><th>Concepto</th><th>Detalle</th></tr></thead><tbody><tr><td>[Concepto]</td><td>[Detalle]</td></tr><tr><td>[Concepto]</td><td>[Detalle]</td></tr></tbody></table>';
      insert(wrapper);
    } else {
      const block = doc.createElement(kind);
      if (kind === 'p') { block.textContent = '[Escribí tu párrafo]'; block.setAttribute('contenteditable','plaintext-only'); }
      else { const span = doc.createElement('span'); span.textContent = kind === 'h2' ? '[Título de sección]' : '[Subtítulo]'; block.append(span); }
      insert(block);
    }
  }, { signal }));
  imageInput.addEventListener('change', async () => {
    const file = imageInput.files?.[0]; imageInput.value = '';
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setStatus('Usá una imagen PNG, JPG o WebP de hasta 10 MB.',true); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const doc = frame.contentDocument!, image = doc.createElement('img');
      image.src = String(reader.result); image.alt = file.name;
      if (replacingImage) { replacingImage.querySelector('img')?.replaceWith(image); changed(); }
      else { const figure = doc.createElement('figure'); figure.style.setProperty('--figure-width','80%'); figure.append(image); const caption = doc.createElement('figcaption'); caption.textContent = '[Comentario opcional de la imagen]'; figure.append(caption); insert(figure); }
      image.addEventListener('load',syncHeight,{ once:true });
    };
    reader.onerror = () => setStatus('No se pudo leer la imagen.',true); reader.readAsDataURL(file);
  }, { signal });

  node('te-save-html').addEventListener('click', () => {
    const main = documentMain(); if (!main) return;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="umsa-template" content="${current.id}"><meta name="umsa-example" content="${example}"><title>Documento UMSA</title><style>${styles}</style><style>@media print{.toolbar,.figure-replace{display:none!important}}</style></head><body><div class="paper">${brand}<main>${cleanMain(main.innerHTML)}</main></div></body></html>`;
    download(new Blob([html],{ type:'text/html' }),`${current.id}-editable.html`); setStatus('Editable descargado. Podés recuperarlo desde este editor.');
  }, { signal });
  node('te-print').addEventListener('click', () => { frame.contentWindow?.focus(); frame.contentWindow?.print(); }, { signal });
  node('te-reset-document').addEventListener('click', async () => {
    if (!confirm('¿Empezar una copia nueva? El borrador actual será reemplazado. Descargá el editable si querés conservarlo.')) return;
    try { await flush(); await removeDraft(draftId()); await loadDocument(current,example,false); }
    catch { setStatus('No se pudo crear una copia nueva. Tu borrador se conserva.',true); }
  }, { signal });
  node<HTMLInputElement>('te-import-html').addEventListener('change', async event => {
    const input = event.currentTarget as HTMLInputElement, file = input.files?.[0]; input.value = '';
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('El editable no puede superar los 20 MB.');
      const imported = new DOMParser().parseFromString(await file.text(),'text/html');
      const id = imported.querySelector('meta[name="umsa-template"]')?.getAttribute('content');
      if (id !== current.id || !imported.querySelector('main')) throw new Error('Abrí primero la plantilla de origen de este editable.');
      if (!confirm('¿Reemplazar el borrador por este editable?')) return;
      await flush(); await showDocument(imported.querySelector('main')!.innerHTML); changed(); await flush();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'No se pudo recuperar el editable.',true); }
  }, { signal });

  const refreshArchive = async () => {
    archiveUrls.splice(0).forEach(url => URL.revokeObjectURL(url));
    const files = (await listPdfs()).sort((a,b) => b.created - a.created);
    node('te-pdf-count').textContent = String(files.length); pdfList.replaceChildren();
    if (!files.length) { const p = document.createElement('p'); p.textContent = 'Todavía no generaste ningún PDF.'; pdfList.append(p); }
    files.forEach(file => {
      const article = document.createElement('article'), title = document.createElement('h3'), info = document.createElement('p'), actions = document.createElement('div');
      title.textContent = file.title;
      info.textContent = `${new Date(file.created).toLocaleString('es-AR')} · ${Math.max(1,Math.round(file.blob.size/1024))} KB`;
      const url = URL.createObjectURL(file.blob); archiveUrls.push(url);
      const view = document.createElement('a'); view.href = url; view.target = '_blank'; view.rel = 'noopener noreferrer'; view.textContent = 'Abrir PDF ↗';
      const save = document.createElement('a'); save.href = url; save.download = file.title + '.pdf'; save.textContent = 'Descargar PDF ↗';
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Eliminar de esta bandeja';
      remove.addEventListener('click',async () => {
        if (!confirm('¿Eliminar este PDF de la bandeja? Descargalo antes si querés conservarlo.')) return;
        try { await removePdf(file.id); await refreshArchive(); } catch { setStatus('No se pudo eliminar el PDF.',true); }
      },{ signal });
      actions.append(view,save,remove); article.append(title,info,actions); pdfList.append(article);
    });
  };
  const openArchive = async () => {
    try { await refreshArchive(); if (!pdfDialog.open) pdfDialog.showModal(); }
    catch { setStatus('No se pudo abrir la bandeja de PDFs de este navegador.',true); }
  };
  node('te-show-pdfs').addEventListener('click', () => { void openArchive(); },{ signal });
  node('te-close-pdfs').addEventListener('click', () => pdfDialog.close(),{ signal });
  pdfDialog.addEventListener('click', event => { if (event.target === pdfDialog) pdfDialog.close(); },{ signal });
  node('te-generate-pdf').addEventListener('click',async () => {
    if (generating || loading || !documentMain()) return;
    generating = true; setEnabled(); frame.style.pointerEvents = 'none';
    try {
      await flush(); setStatus('Preparando tu PDF…');
      const { createTemplatePdf } = await import('./templatePdf');
      const blob = await createTemplatePdf(documentMain()!,current.id);
      const created = Date.now(), title = `${current.title} · ${new Date(created).toLocaleString('es-AR').replace(/[/:]/g,'-')}`;
      try { await savePdf({ id:crypto.randomUUID(),templateId:current.id,title,created,blob }); }
      catch { download(blob,current.id+'.pdf'); throw new Error('PDF descargado. No se pudo guardar en la bandeja; conservá el archivo descargado.'); }
      setStatus('PDF guardado en Mis PDFs. Podés abrirlo o descargarlo.'); await openArchive();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'No se pudo generar el PDF.',true); }
    finally { generating = false; frame.style.pointerEvents = ''; setEnabled(); }
  },{ signal });
  node<HTMLInputElement>('te-import-pdf').addEventListener('change',async event => {
    const input = event.currentTarget as HTMLInputElement, files = Array.from(input.files || []); input.value = '';
    try {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024 || !(await file.slice(0,5).text()).startsWith('%PDF-')) throw new Error('Agregá un PDF válido de hasta 20 MB.');
        await savePdf({ id:crypto.randomUUID(),templateId:current.id,title:file.name.replace(/\.pdf$/i,''),created:Date.now(),blob:new Blob([file],{ type:'application/pdf' }) });
      }
      await refreshArchive();
    } catch (error) { const p = document.createElement('p'); p.setAttribute('role','alert'); p.textContent = error instanceof Error ? error.message : 'No se pudo agregar el PDF.'; pdfList.prepend(p); }
  },{ signal });
  const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty || generating) { event.preventDefault(); event.returnValue = ''; } };
  window.addEventListener('beforeunload',beforeUnload,{ signal });
  window.addEventListener('pagehide',() => { void flush().catch(() => undefined); },{ signal });
  document.addEventListener('astro:before-swap',() => { void flush().catch(() => undefined); controller.abort(); resize?.disconnect(); archiveUrls.forEach(url => URL.revokeObjectURL(url)); },{ once:true });
  const url = new URL(location.href);
  void loadDocument(findTemplate(url.searchParams.get('documento')),url.searchParams.get('vista') === 'ejemplo',false);
  void refreshArchive().catch(() => setStatus('La bandeja local no está disponible en este navegador.',true));
}
