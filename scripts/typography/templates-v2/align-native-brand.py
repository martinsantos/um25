"""Keep the SVG's fixed aspect/size; align its ink to the native table rule.

Column font metrics differ across spreadsheet engines. Measure the first native
print, adjust only each image's horizontal marker, then reprint and verify.
"""
from pathlib import Path
from lxml import etree as E
import os,tempfile,zipfile,pdfplumber
ROOT=Path(os.environ.get('UM_TEMPLATE_WORK',Path(tempfile.gettempdir())/'um-sans-template-build'))
file=ROOT/'entrega/presupuesto-interno.xlsx'
S='http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
def tag(n):return '{'+S+'}'+n
with pdfplumber.open(ROOT/'qa/r2/excel-print/presupuesto-interno.pdf') as pdf:
    offsets=[];seen=set()
    for page in pdf.pages:
        curves=[c for c in page.curves if c['bottom']<85]
        lines=[l for l in page.lines if l['top']<100 and l['x1']-l['x0']>400]
        if not curves:continue
        title=page.extract_text().splitlines()[0]
        if title in seen:continue
        seen.add(title)
        assert len(curves)>=18 and lines,'missing brand or table rule'
        edge=max(c['x1'] for c in curves);width=edge-min(c['x0'] for c in curves)
        offsets.append((lines[0]['x1']-edge)/width*204*9525)
    assert len(offsets)==4,offsets
with zipfile.ZipFile(file) as z:parts={n:z.read(n) for n in z.namelist()}
for i,delta in enumerate(offsets,1):
    key=f'xl/drawings/drawing{i}.xml';tree=E.fromstring(parts[key]);offset=tree.find('.//'+tag('from')+'/'+tag('colOff'))
    offset.text=str(round(int(offset.text)+delta));parts[key]=E.tostring(tree,encoding='UTF-8',xml_declaration=True,standalone=True)
with zipfile.ZipFile(file,'w',zipfile.ZIP_DEFLATED) as z:
    for key,data in parts.items():z.writestr(key,data)
print('Four native SVG positions adjusted; aspect ratio, cells and formulas untouched.')
