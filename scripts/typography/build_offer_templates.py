#!/usr/bin/env python3
"""Build branded, editable offer templates from the pinned UM Sans 2 release.

Dependencies: python-docx, PyMuPDF, openpyxl and LibreOffice (system Python).
Font files/cache stay in --work; no global installation or customer data.
"""
import argparse,base64,hashlib,html,json,os,re,shutil,subprocess,zipfile
from pathlib import Path
from xml.sax.saxutils import escape
import fitz
from docx import Document
from docx.shared import Pt,Mm,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from openpyxl import Workbook
from openpyxl.styles import Font,PatternFill,Alignment,Border,Side
from openpyxl.worksheet.datavalidation import DataValidation

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'public/fonts/um-sans/v2.0.0'
TYPES={'oferta-completa':('Propuesta técnica y económica','Alcance, entregables, inversión y condiciones.'),'resumen-comercial':('Propuesta comercial','La decisión, en una página.'),'membrete':('Título del documento','Subtítulo o breve descripción del contenido.')}
FOOTER='Última Milla · ultimamilla.com.ar · Houssay 1159, Guaymallén, Mendoza'


def field(parent,text,bold=False,size=None):
 run=parent.add_run(text);run.font.name='UM Sans 2';run.bold=bold
 if size:run.font.size=Pt(size)
 for attr in ['ascii','hAnsi','cs','eastAsia']:run._element.get_or_add_rPr().rFonts.set(qn('w:'+attr),'UM Sans 2')
 return run


def table(doc,rows,header=True):
 t=doc.add_table(rows=0,cols=len(rows[0]));t.style='Table Grid'
 for i,row in enumerate(rows):
  cells=t.add_row().cells
  for cell,value in zip(cells,row):
   p=cell.paragraphs[0];p.paragraph_format.space_after=Pt(6);p.paragraph_format.space_before=Pt(6)
   field(p,value,bold=i==0 and header,size=11)
   if i==0 and header:
    shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'F2F3F4');cell._tc.get_or_add_tcPr().append(shade)
  props=t.rows[-1]._tr.get_or_add_trPr();props.append(OxmlElement('w:cantSplit'))
  if i==0 and header:props.append(OxmlElement('w:tblHeader'))
 return t


def build_docx(kind,out,logo):
 title,lead=TYPES[kind];doc=Document();s=doc.sections[0]
 s.page_width,s.page_height=Mm(210),Mm(297);s.left_margin=s.right_margin=Mm(20);s.top_margin=Mm(30);s.bottom_margin=Mm(24);s.header_distance=Mm(12);s.footer_distance=Mm(12)
 for name,size,bold in [('Normal',12,False),('Title',28,True),('Subtitle',14,False),('Heading 1',18,True),('Heading 2',15,True),('Heading 3',13,True),('Caption',10.5,False),('Footer',9.5,False)]:
  style=doc.styles[name];style.font.name='UM Sans 2';style.font.size=Pt(size);style.font.bold=bold;style.font.color.rgb=RGBColor.from_string('17191C');style.paragraph_format.line_spacing=1.45;style.paragraph_format.space_after=Pt(10)
  style.font.italic=False
  # Theme fonts in the stock Word template otherwise override the named face
  # in LibreOffice headings. Remove all theme indirection and inherited tracking.
  rpr=style.element.get_or_add_rPr();rfonts=rpr.rFonts
  for attribute in list(rfonts.attrib):del rfonts.attrib[attribute]
  for attribute in ['ascii','hAnsi','cs','eastAsia']:rfonts.set(qn('w:'+attribute),'UM Sans 2')
  for item in list(rpr):
   if item.tag in [qn('w:spacing'),qn('w:iCs')]:rpr.remove(item)
  for item in list(style.element.get_or_add_pPr()):
   if item.tag in [qn('w:pBdr'),qn('w:numPr')]:style.element.get_or_add_pPr().remove(item)
  if name.startswith('Heading'):style.paragraph_format.space_before=Pt(16);style.paragraph_format.keep_with_next=True
 header=s.header.paragraphs[0];header.add_run().add_picture(str(logo),width=Mm(78));header.paragraph_format.space_after=Pt(8)
 # Paragraph spacing separates the header from the body, not the image from
 # its border. Reserve an explicit 12 pt gap above the rule in every page header.
 border=OxmlElement('w:pBdr');bottom=OxmlElement('w:bottom');bottom.set(qn('w:val'),'single');bottom.set(qn('w:sz'),'12');bottom.set(qn('w:space'),'12');bottom.set(qn('w:color'),'B91C1C');border.append(bottom);header._p.get_or_add_pPr().append(border)
 foot=s.footer.paragraphs[0];field(foot,FOOTER+'\n',size=9.5);field(foot,'Página ',size=9.5);r=foot.add_run();f=OxmlElement('w:fldSimple');f.set(qn('w:instr'),'PAGE');r._r.addnext(f)
 doc.add_paragraph('[Código de documento] · [Fecha]',style='Caption');doc.add_paragraph(title,style='Title');doc.add_paragraph(lead,style='Subtitle')
 p=doc.add_paragraph();field(p,'Para: ',True);field(p,'[Cliente / organización]');p=doc.add_paragraph();field(p,'Proyecto: ',True);field(p,'[Nombre del proyecto]')
 if kind=='membrete':
  doc.add_paragraph('Asunto',style='Heading 1');doc.add_paragraph('[Desarrollar el contenido del documento. Usar los estilos Título, Subtítulo, Encabezado y Normal para conservar la jerarquía.]');doc.add_paragraph('[Párrafo de desarrollo.]');doc.add_paragraph('[Nombre y cargo]\n[Datos de contacto]')
 else:
  doc.add_paragraph('Objetivo y alcance',style='Heading 1');doc.add_paragraph('[Describir el resultado que necesita el cliente, los límites del trabajo y el criterio de entrega.]')
  if kind=='oferta-completa':
   doc.add_paragraph('Entregables',style='Heading 2');table(doc,[['Entregable','Criterio de aceptación'],['[Entregable 1]','[Evidencia / resultado verificable]'],['[Entregable 2]','[Evidencia / resultado verificable]']]);doc.add_paragraph('Plan de trabajo',style='Heading 2');table(doc,[['Etapa','Plazo','Responsable'],['[Etapa 1]','[Plazo]','[Responsable]'],['[Etapa 2]','[Plazo]','[Responsable]']]);doc.add_paragraph('Supuestos y exclusiones',style='Heading 2');doc.add_paragraph('[Indicar dependencias, responsabilidades del cliente y conceptos no incluidos.]');doc.add_page_break()
  doc.add_paragraph('Inversión',style='Heading 1');table(doc,[['Concepto','Cantidad','Unitario','Importe'],['[Servicio / suministro]','[Cant.]','[Precio]','[Importe]'],['[Servicio / suministro]','[Cant.]','[Precio]','[Importe]']]);p=doc.add_paragraph();p.paragraph_format.space_before=Pt(10);field(p,'Subtotal [importe] · Impuestos [importe]\nTotal [moneda e importe]',True)
  doc.add_paragraph('Condiciones comerciales',style='Heading 2');doc.add_paragraph('[Moneda, impuestos, validez, forma de pago, plazo de entrega y alcance del soporte. Completar según la oferta; no presuponer condiciones.]')
  if kind=='oferta-completa':doc.add_paragraph('Aceptación y contacto',style='Heading 2');doc.add_paragraph('[Nombre y cargo del responsable]\n[Contacto comercial]\n[Forma de aceptación acordada]')
 doc.core_properties.title=title+' · Última Milla';doc.core_properties.author='ULTIMA MILLA';doc.core_properties.subject='Plantilla editable con UM Sans 2.0; completar antes de emitir.'
 target=out/(kind+'.docx');doc.save(target)
 with zipfile.ZipFile(target) as source,zipfile.ZipFile(out/(kind+'.dotx'),'w',zipfile.ZIP_DEFLATED) as dest:
  for name in source.namelist():
   b=source.read(name)
   if name=='[Content_Types].xml':b=b.replace(b'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',b'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml')
   dest.writestr(name,b)
 return doc


def build_html(kind,out,logo,doc):
 title,lead=TYPES[kind];woff=base64.b64encode((BASE/'UMSans2-Variable.woff2').read_bytes()).decode();ital=base64.b64encode((BASE/'UMSans2-VariableItalic.woff2').read_bytes()).decode();img=base64.b64encode(logo.read_bytes()).decode()
 blocks=[]
 # Preserve the document order of paragraphs and tables, without executing content.
 from docx.text.paragraph import Paragraph
 from docx.table import Table
 for child in doc.element.body:
  if child.tag==qn('w:p'):
   p=Paragraph(child,doc);text=p.text
   if not text.strip():continue
   style=p.style.name
   tag='h1' if style=='Title' else 'h2' if style=='Heading 1' else 'h3' if style.startswith('Heading') else 'p'
   cls='lead' if style=='Subtitle' else 'guide' if style=='Caption' else ''
   blocks.append(f'<{tag} class="{cls}" contenteditable="true" aria-label="{html.escape(text[:70],quote=True)}">{html.escape(text).replace(chr(10),"<br>")}</{tag}>')
  elif child.tag==qn('w:tbl'):
   t=Table(child,doc);blocks.append('<div class="table-wrap"><table>')
   for i,row in enumerate(t.rows):
    tag='th' if i==0 else 'td';blocks.append('<tr>'+''.join(f'<{tag} contenteditable="true">{html.escape(c.text)}</{tag}>' for c in row.cells)+'</tr>')
   blocks.append('</table></div>')
 css=f'''@font-face{{font-family:UM;src:url(data:font/woff2;base64,{woff});font-weight:100 900}}@font-face{{font-family:UM;src:url(data:font/woff2;base64,{ital});font-weight:100 900;font-style:italic}}'''+'''
+*{box-sizing:border-box}body{margin:0;background:#eeefed;color:#17191c;font:20px/1.65 UM,Arial,sans-serif;font-synthesis:none}header,main,footer{max-width:820px;margin:auto;padding:32px 60px;background:white}header{margin-top:28px;padding-bottom:22px;border-bottom:3px solid #b91c1c}header img{width:330px;max-width:100%;height:auto}main{padding-top:24px}footer{font-size:16px;color:#50545b;padding-top:20px;border-top:1px solid #ddd;margin-bottom:32px}h1{font-size:40px;line-height:1.15;margin:20px 0 24px;font-weight:700}h2{font-size:28px;line-height:1.25;margin:38px 0 18px}h3{font-size:24px;line-height:1.35;margin:30px 0 16px}p{margin:22px 0}.lead{font-size:22px;line-height:1.5}.guide{font-size:16px;color:#50545b}table{width:100%;border-collapse:collapse;font-size:16px;line-height:1.5;font-variant-numeric:tabular-nums}td,th{padding:12px;border:1px solid #ccc;vertical-align:top;text-align:left}th{background:#f2f3f4;font-weight:600}.table-wrap{overflow:auto}[contenteditable]:focus{outline:2px solid #1a56c0;outline-offset:4px}.toolbar{padding:16px 20px;display:flex;justify-content:center;gap:16px;flex-wrap:wrap;font-size:16px}button{font:600 16px/1.5 UM,Arial;padding:10px 18px;border:1px solid #b91c1c;border-radius:4px;background:#b91c1c;color:white;cursor:pointer}button:focus-visible{outline:3px solid #1a56c0;outline-offset:3px}.toolbar span{align-self:center;max-width:34em}@media(max-width:600px){header,main,footer{padding:24px 20px}h1{font-size:32px}table{min-width:430px}}@page{size:A4;margin:16mm 18mm}@media print{body{background:white;font-size:12pt;line-height:1.45}.toolbar{display:none}header,main,footer{padding:0;max-width:none;margin:0}header{padding-bottom:7mm;margin-bottom:6mm}header img{width:78mm}footer{font-size:9.5pt;margin-top:8mm;padding-top:4mm}h1{font-size:28pt}h2{font-size:18pt}h3{font-size:15pt}.lead{font-size:14pt}.guide,table{font-size:10.5pt}h1,h2,h3{break-after:avoid}tr{break-inside:avoid}p{orphans:3;widows:3}.table-wrap{overflow:visible}table{min-width:0}td,th{padding:7pt}[contenteditable]:focus{outline:none}}
+'''.replace('\n+','\n')
 script='''document.getElementById('print').addEventListener('click',()=>window.print());document.getElementById('save').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob(['<!doctype html>\\n'+document.documentElement.outerHTML],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='oferta-ultima-milla.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});'''
 page=f'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} · Última Milla</title><style>{css}</style><div class="toolbar"><button id="print">Imprimir / guardar PDF</button><button id="save">Guardar HTML editado</button><span>Completá los campos entre corchetes antes de emitir. La edición queda en este archivo.</span></div><header><img src="data:image/png;base64,{img}" alt="Última Milla"></header><main>'+''.join(blocks)+f'</main><footer>{FOOTER}</footer><script>{script}</script></html>'
 (out/(kind+'.html')).write_text(page)


def build_excel(out,logo):
 from openpyxl.drawing.image import Image
 wb=Workbook();s=wb.active;s.title='Oferta económica';s.sheet_view.showGridLines=False
 s.merge_cells('A1:F1');s.row_dimensions[1].height=36;brand=Image(str(logo));brand.width=310;brand.height=29;s.add_image(brand,'A1')
 s.merge_cells('A2:F2');s['A2']='Oferta económica · UM Sans 2.0';s['A2'].font=Font(name='UM Sans 2',size=16,bold=True);s.row_dimensions[2].height=26
 for row,text in [(4,'Cliente: [Organización]'),(5,'Proyecto: [Proyecto]'),(6,'Referencia: [Código] · Fecha: [Fecha] · Moneda: [Moneda]')]:s.merge_cells(start_row=row,start_column=1,end_row=row,end_column=6);s.cell(row,1,text)
 for c,text in enumerate(['Ítem','Descripción','Cantidad','Unidad','Precio unitario','Importe'],1):s.cell(8,c,text)
 for row in range(9,24):s.cell(row,1,row-8);s.cell(row,6,f'=IF(OR(C{row}="",E{row}=""),"",ROUND(C{row}*E{row},2))')
 s['E25']='Subtotal';s['F25']='=IF(COUNT(F9:F23)=0,"",SUM(F9:F23))';s['E26']='Impuestos';s['F26']=None;s['E27']='Total';s['F27']='=IF(OR(F25="",F26=""),"",F25+F26)'
 s.merge_cells('A29:F29');s['A29']='Validez, forma de pago y entrega: [Completar según la oferta]';s.merge_cells('A31:F31');s['A31']=FOOTER
 widths={'A':5,'B':29,'C':10,'D':9,'E':14,'F':14}
 for col,w in widths.items():s.column_dimensions[col].width=w
 for row in s.iter_rows(min_row=4,max_row=31,max_col=6):
  for cell in row:
   cell.font=Font(name='UM Sans 2',size=11,bold=cell.row in [8,25,26,27]);cell.alignment=Alignment(vertical='center',wrap_text=True)
   if cell.row==8:cell.fill=PatternFill('solid',fgColor='17191C');cell.font=Font(name='UM Sans 2',size=11,bold=True,color='FFFFFF')
   if 9<=cell.row<=23:cell.border=Border(bottom=Side(style='hair',color='CCCCCC'))
 for row in range(8,24):s.row_dimensions[row].height=26
 s.row_dimensions[29].height=36;s.row_dimensions[31].height=30
 for row in range(9,28):
  for col in ['E','F']:
   if col=='F' or row<=23:s[f'{col}{row}'].number_format='#,##0.00'
 dv=DataValidation(type='decimal',operator='greaterThanOrEqual',formula1=0,allow_blank=True);dv.errorTitle='Valor no válido';dv.error='Ingresá un número mayor o igual que cero.';dv.showErrorMessage=True;s.add_data_validation(dv);dv.add('C9:C23');dv.add('E9:E23');dv.add('F26')
 s.freeze_panes='C9';s.print_title_rows='1:8';s.print_area='A1:F31';s.page_setup.orientation='portrait';s.page_setup.paperSize=s.PAPERSIZE_A4;s.page_setup.fitToWidth=1;s.page_setup.fitToHeight=1;s.sheet_properties.pageSetUpPr.fitToPage=True;s.oddFooter.center.text='Última Milla · Página &P de &N';s.oddFooter.center.size=10;s.oddFooter.center.font='UM Sans 2,Regular'
 from openpyxl.worksheet.page import PageMargins
 s.page_margins=PageMargins(left=0.55,right=0.55,top=0.55,bottom=0.65,header=0.2,footer=0.25)
 wb.save(out/'oferta-economica.xlsx')


def main():
 p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=BASE/'plantillas');p.add_argument('--work',type=Path,required=True);args=p.parse_args();out=args.output.resolve();work=args.work.resolve()
 if out.exists():p.error('Choose a new output directory; preserve reviewed templates.')
 out.mkdir(parents=True);work.mkdir(parents=True,exist_ok=True);fonts=work/'fonts';fonts.mkdir(exist_ok=True);cache=work/'font-cache';cache.mkdir(exist_ok=True)
 for font in BASE.glob('*.ttf'):
  if 'Variable' not in font.name:shutil.copy2(font,fonts/font.name)
 config=work/'fontconfig.xml';config.write_text(f'<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>{escape(str(fonts))}</dir><dir>/usr/share/fonts</dir><cachedir>{escape(str(cache))}</cachedir></fontconfig>')
 svg=(ROOT/'public/images/logo-light.svg').read_text().replace('viewBox="0 0 620 100"','viewBox="3 8 609 57"');v=fitz.open(stream=svg.encode(),filetype='svg');pdf=fitz.open(stream=v.convert_to_pdf(),filetype='pdf');logo=work/'logo.png';pdf[0].get_pixmap(matrix=fitz.Matrix(2,2),alpha=True).save(logo)
 for kind in TYPES:
  doc=build_docx(kind,out,logo);build_html(kind,out,logo,doc)
  for fmt in ['pdf','odt']:
   subprocess.run(['soffice','--headless','--convert-to',fmt,'--outdir',str(out),str(out/(kind+'.docx'))],env={**os.environ,'FONTCONFIG_FILE':str(config)},check=True,stdout=subprocess.DEVNULL)
  pdf=fitz.open(out/(kind+'.pdf'))
  from PIL import Image
  pix=pdf[0].get_pixmap(matrix=fitz.Matrix(1,1));Image.frombytes('RGB',[pix.width,pix.height],pix.samples).save(out/(kind+'.webp'))
 build_excel(out,logo)
 (out/'LEEME.txt').write_text('UM Sans 2.0 · Plantillas de Última Milla\n\nInstalar los TTF del paquete de fuentes antes de editar Word, ODT o Excel.\nEl HTML incorpora fuentes e imagen para funcionar sin conexión. PDF conserva\nlas fuentes incrustadas. Completar todos los campos entre corchetes antes de\nemitir; la plantilla no fija precios, impuestos ni condiciones contractuales.\n\nA4: oferta completa, resumen comercial y membrete; cada uno en HTML, PDF,\nDOCX, DOTX y ODT. Excel incluye cálculo económico, no una oferta firmada.\nLos estilos están en UM Sans 2; no se incrustan fuentes editables en DOCX.\n')
 files=[{'file':f.name,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(out.iterdir()) if f.is_file()]
 (out/'manifest.json').write_text(json.dumps({'version':'2.0.0','fontFamily':'UM Sans 2','paper':'A4','templates':TYPES,'files':files},ensure_ascii=False,indent=2)+'\n')
 with zipfile.ZipFile(out/'Plantillas-UMSans2-2.0.0.zip','w',zipfile.ZIP_DEFLATED) as z:
  for f in sorted(out.iterdir()):
   if f.is_file() and f.suffix!='.zip':z.write(f,'Plantillas-UMSans2-2.0.0/'+f.name)
 print('Built',len(files),'template files at',out)

if __name__=='__main__':main()
