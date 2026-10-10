from pathlib import Path
import base64,html
from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table
from docx.oxml.ns import qn
import os, tempfile
ROOT=Path(os.environ.get("UM_TEMPLATE_WORK",Path(tempfile.gettempdir())/"um-sans-template-build"))
REPO=Path(os.environ.get("UM_TEMPLATE_REPO",Path(__file__).resolve().parents[3]))
BASE=REPO/'public/fonts/um-sans/v2.0.0'
enc=lambda p:base64.b64encode(p.read_bytes()).decode()
css='''
*{box-sizing:border-box}html{font-synthesis:none}body{margin:0;background:#eee;color:#17191c;font:22px/1.55 UM,Arial,sans-serif}button{font:inherit;cursor:pointer;padding:12px 20px;background:#fff;border:1px solid #777;border-radius:4px}button:focus-visible,a:focus-visible,[contenteditable]:focus-visible{outline:3px solid #1a56c0;outline-offset:4px}.toolbar{max-width:1000px;padding:24px;margin:auto;display:flex;align-items:center;gap:16px;flex-wrap:wrap}.toolbar p{font-size:18px;margin:0}.paper{max-width:1000px;margin:0 auto 32px;background:#fff;padding:52px 68px}.brand{display:flex;justify-content:flex-end;padding-bottom:14px;border-bottom:1px solid #dc2626;margin-bottom:42px}.brand img{display:block;width:295px;height:auto;max-width:100%}main{counter-reset:section subsection detail}.meta{font-size:18px;color:#555}.subtitle{font-size:26px;color:#444}h1{font-size:42px;line-height:1.12;margin:16px 0 22px}p{margin:0 0 14px}h2,h3,h4{display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:.25em;align-items:baseline;margin:32px 0 12px;line-height:1.2;break-after:avoid;page-break-after:avoid}h2{font-size:30px;margin-top:40px;counter-increment:section;counter-reset:subsection detail}h3{font-size:26px;margin-top:32px;counter-increment:subsection;counter-reset:detail}h4{font-size:24px;margin-top:28px;counter-increment:detail}h2+h3,h3+h4,h2+h4{margin-top:12px}h2::before{content:counter(section)'.'}h3::before{content:counter(section)'.'counter(subsection)'.'}h4::before{content:counter(section)'.'counter(subsection)'.'counter(detail)'.'}table{width:100%;border-collapse:collapse;margin:18px 0 24px;font-size:18px;line-height:1.35;font-variant-numeric:tabular-nums}th,td{padding:10px 12px;border:1px solid #ddd;vertical-align:middle;text-align:left;overflow-wrap:anywhere}thead{background:#000;color:#fff;display:table-header-group}tbody tr:nth-child(even){background:#f5f5f5}tr{break-inside:avoid}footer{font-size:16px;color:#666;border-top:1px solid #ddd;margin-top:44px;padding-top:12px}p{orphans:3;widows:3}.align-right{text-align:right}@media(max-width:680px){body{font-size:20px}.paper{padding:28px 20px}h1{font-size:34px}.subtitle{font-size:23px}h2{font-size:26px}h3{font-size:23px}h4{font-size:21px}.brand img{width:260px}table{font-size:17px}th,td{padding:8px 6px}.table-wrap{overflow-x:auto}table{min-width:600px}}
@page{size:A4;margin:31mm 20mm 24mm 25mm}@media print{h2,h3,h4{column-gap:.25em}body{font-size:12pt;line-height:1.2;background:#fff}.toolbar{display:none}.paper{padding:0;margin:0;max-width:none}.brand{position:fixed;left:0;right:0;top:-18mm;height:12mm;padding:0 0 7pt;margin:0;align-items:flex-start}.brand img{width:62mm}footer{position:fixed;bottom:-13mm;left:0;right:0;font-size:9pt;margin:0;padding-top:6pt}h1{font-size:26pt;line-height:1.08;margin:12pt 0}.meta{font-size:10pt}.subtitle{font-size:13pt}h2+h3,h3+h4,h2+h4{margin-top:8pt}h2{font-size:16pt;margin:24pt 0 6pt}h3{font-size:13pt;margin:18pt 0 6pt}h4{font-size:12pt;margin:16pt 0 6pt}p{margin:0 0 8pt}table{font-size:10pt;min-width:0;line-height:1.12;margin:10pt 0 12pt}th,td{padding:5pt 6pt;overflow-wrap:normal}.table-wrap{overflow:visible}.page-break{break-before:page}.brand,footer{print-color-adjust:exact}thead{print-color-adjust:exact}[contenteditable]:focus{outline:none}}
'''
for kind in ['oferta-completa','resumen-comercial','membrete','ejemplo-licitacion','imagenes-documento']:
    d=Document(ROOT/'entrega'/f'{kind}.docx');blocks=[]
    children=list(d.element.body);skip=set()
    for child_index,child in enumerate(children):
        if child_index in skip:continue
        if child.tag==qn('w:p'):
            p=Paragraph(child,d)
            drawings=p._p.xpath('.//wp:inline')
            if drawings:
                inline=drawings[0];rid=inline.xpath('.//a:blip')[0].get(qn('r:embed'))
                part=d.part.related_parts[rid];prop=inline.find(qn('wp:docPr'))
                extent=inline.find(qn('wp:extent'));width_mm=int(extent.get('cx'))/36000
                alt=html.escape(prop.get('descr','Imagen del documento'),quote=True)
                file=prop.get('title','');asset='/images/services/productos/infraestructura/'+file if file in ['1.2.png','1.8.jpg'] else ''
                caption=''
                if child_index+1<len(children) and children[child_index+1].tag==qn('w:p'):
                    cp=Paragraph(children[child_index+1],d)
                    if cp.style.name=='Comentario de imagen':
                        caption='<figcaption contenteditable="true">'+''.join('<strong>'+html.escape(r.text)+'</strong>' if r.bold else html.escape(r.text) for r in cp.runs)+'</figcaption>'
                        skip.add(child_index+1)
                data=base64.b64encode(part.blob).decode()
                blocks.append(f'<figure class="document-figure" style="--figure-width:{width_mm/165*100:.3f}%"><img src="data:{part.content_type};base64,{data}" data-asset="{asset}" alt="{alt}"><button type="button" class="figure-replace">Cambiar imagen</button>{caption}</figure>')
                continue
            if not p.text.strip():continue
            text=''.join(('<strong>'+html.escape(r.text)+'</strong>') if r.bold else html.escape(r.text) for r in p.runs).replace('\n','<br>');style=p.style.name
            if '\t' in p.text:
                label,value=p.text.split('\t',1)
                blocks.append(f'<p class="document-meta"><span>{html.escape(label)}</span><span contenteditable="true">{html.escape(value)}</span></p>')
                continue
            if style.startswith('Heading'):
                level=int(style.split()[-1]);tag='h'+str(level+1);cls='page-break' if p.paragraph_format.page_break_before else ''
                blocks.append(f'<{tag} class="{cls}"><span contenteditable="true">{text}</span></{tag}>')
            else:
                tag='h1' if style=='Title' else 'p';cls='meta' if style=='Caption' else 'subtitle' if style=='Subtitle' else 'align-right' if p.alignment==2 else ''
                spacing=f' style="margin-top:{p.paragraph_format.space_before.pt}pt"' if kind=='membrete' and p.paragraph_format.space_before else ''
                blocks.append(f'<{tag} class="{cls}"{spacing} contenteditable="true">{text}</{tag}>')
        elif child.tag==qn('w:tbl'):
            t=Table(child,d);widths=[int(c.w) for c in t._tbl.tblGrid.gridCol_lst];total=sum(widths)
            rows=[]
            for i,row in enumerate(t.rows):
                tag='th' if i==0 else 'td'
                cells=''.join(f'<{tag} style="text-align:{ {1:"center",2:"right"}.get(c.paragraphs[0].alignment,"left") }" contenteditable="true">{html.escape(c.text)}</{tag}>' for c in row.cells)
                rows.append('<tr>'+cells+'</tr>')
            cols=''.join(f'<col style="width:{w/total*100:.3f}%">' for w in widths)
            blocks.append('<div class="table-wrap"><table><colgroup>'+cols+'</colgroup><thead>'+rows[0]+'</thead><tbody>'+''.join(rows[1:])+'</tbody></table></div>')
    fonts=f'@font-face{{font-family:UM;src:url(data:font/woff2;base64,{enc(BASE/"UMSans2-Variable.woff2")});font-weight:100 900;font-display:block}}'
    css=css.replace('counter-reset:subsection detail','counter-set:subsection 0 detail 0').replace('counter-reset:detail','counter-set:detail 0')
    # Page margin boxes avoid Chromium fragmenting fixed headers outside the page area.
    # https://developer.chrome.com/blog/print-margins
    brand_side='left' if kind=='membrete' else 'right'
    print_fix='@media print{.brand,footer{display:none}}@page{'+f'@top-center{{content:"";width:165mm;margin-top:14mm;margin-bottom:8mm;background:url(data:image/svg+xml;base64,{enc(ROOT/"logo.svg")}) {brand_side} top/54mm auto no-repeat;border-bottom:.6pt solid #dc2626}}'+ '@bottom-left{content:"ULTIMA MILLA S.A. · ultimamilla.com.ar";font:9pt UM;color:#666;vertical-align:middle;width:140mm;margin-top:9mm;margin-bottom:9mm;border-top:.4pt solid #ddd}@bottom-right{content:counter(page) " / " counter(pages);font:9pt UM;color:#666;vertical-align:middle;text-align:right;width:25mm;margin-top:9mm;margin-bottom:9mm;border-top:.4pt solid #ddd}}'
    script="""document.getElementById('print').onclick=()=>window.print();document.getElementById('save').onclick=()=>{const u=URL.createObjectURL(new Blob(['<!doctype html>\\n'+document.documentElement.outerHTML],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='oferta-ultima-milla.html';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};"""
    script+="""document.querySelectorAll('.figure-replace').forEach(button=>button.onclick=()=>{const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.hidden=true;document.body.appendChild(input);input.onchange=()=>{const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const img=button.closest('figure').querySelector('img');img.src=reader.result;img.removeAttribute('data-asset');img.alt=file.name;input.remove();};reader.readAsDataURL(file);};input.click();});"""
    script=script.replace('oferta-ultima-milla.html',kind+'-ultima-milla.html')
    page='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(d.core_properties.title)+'</title><style>'+fonts+css+'</style></head><body><div class="toolbar"><button id="print">Imprimir o guardar PDF</button><button id="save">Guardar HTML editado</button><p>Completá los campos entre corchetes antes de emitir la oferta.</p></div><div class="paper"><header class="brand"><img alt="ULTIMA MILLA" src="data:image/png;base64,'+enc(ROOT/'logo.png')+'"></header><main>'+''.join(blocks)+'</main><footer>ULTIMA MILLA S.A. · ultimamilla.com.ar</footer></div><script>'+script+'</script></body></html>'
    refinement='.document-figure{margin:32px 0 48px;padding:0;border:0;background:none;box-shadow:none;break-inside:avoid;page-break-inside:avoid}.document-figure img{display:block;width:var(--figure-width,80%);max-width:100%;max-height:100mm;height:auto;margin:0 auto;border:0;object-fit:contain;border-radius:0;background:none;box-shadow:none}.document-figure figcaption{max-width:85%;margin:12px auto 0;font-size:18px;line-height:1.4;color:#333;text-align:center}.figure-replace{display:block;margin:10px auto;font-size:16px}@media print{.document-figure{margin:18pt 0 24pt}.document-figure figcaption{font-size:10.5pt;margin-top:6pt;line-height:1.15}.figure-replace{display:none}}.brand img{width:270px}h1{font-size:38px}.document-meta{display:grid;grid-template-columns:145px 1fr;gap:12px}.document-meta>span:first-child{font-size:18px;color:#666}th,td{border-inline:0}thead th+th{border-left:1px solid #666}@media(max-width:680px){.document-meta{grid-template-columns:1fr;gap:2px}h1{font-size:32px}.brand img{width:235px}}@media print{h1{font-size:22pt}.document-meta{grid-template-columns:30mm 1fr;gap:0}.document-meta>span:first-child{font-size:10pt}.brand img{width:54mm}}'
    if kind=='membrete':refinement+='.brand{justify-content:flex-start}'
    page=page.replace('</style>',refinement+print_fix+'</style>')
    page=page.replace('data:image/png;base64,'+enc(ROOT/'logo.png'),'data:image/svg+xml;base64,'+enc(ROOT/'logo.svg'))
    (ROOT/'entrega'/f'{kind}.html').write_text(page)
print('5 HTML editables con tipografía incorporada y numeración por niveles')
