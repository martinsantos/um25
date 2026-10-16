"""Measure the native print and align only the brand's horizontal marker."""
from pathlib import Path
from lxml import etree as E
import os,tempfile,zipfile,pdfplumber

ROOT=Path(os.environ.get('UM_TEMPLATE_WORK',Path(tempfile.gettempdir())/'um-sans-template-build'))
S='http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
tag=lambda n:'{'+S+'}'+n
files=[ROOT/'entrega'/name for name in ['oferta-economica.xlsx','ejemplo-economico.xlsx','presupuesto-interno.xlsx']]
files += [ROOT/'qa'/name for name in ['prueba-economica.xlsx','prueba-economica-grandes.xlsx']]
for file in files:
    pdf_path=ROOT/'qa/r2/excel-print'/(file.stem+'.pdf')
    if not file.exists() or not pdf_path.exists():continue
    offsets=[];seen=set()
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            lines=[line for line in page.lines if line['top']<100 and line['x1']-line['x0']>400]
            curves=[curve for curve in page.curves if curve['bottom']<85]
            images=[image for image in page.images if image['bottom']<85]
            if not curves and not images:continue
            title=(page.extract_text() or '').splitlines()[0]
            if title in seen:continue
            seen.add(title)
            assert lines,'Missing header rule'
            if images:left,edge=images[0]['x0'],images[0]['x1']
            else:
                assert len(curves)>=18,'Missing vector brand'
                left=min(curve['x0'] for curve in curves);edge=max(curve['x1'] for curve in curves)
            offsets.append((lines[0]['x1']-edge)/(edge-left))
    assert len(offsets)==(4 if file.stem=='presupuesto-interno' else 1),(file,offsets)
    with zipfile.ZipFile(file) as z:parts={name:z.read(name) for name in z.namelist()}
    for index,delta in enumerate(offsets,1):
        key=f'xl/drawings/drawing{index}.xml';tree=E.fromstring(parts[key])
        offset=tree.find('.//'+tag('from')+'/'+tag('colOff'))
        extent=tree.find('.//'+tag('ext'))
        offset.text=str(round(int(offset.text)+delta*int(extent.get('cx'))))
        parts[key]=E.tostring(tree,encoding='UTF-8',xml_declaration=True,standalone=True)
    with zipfile.ZipFile(file,'w',zipfile.ZIP_DEFLATED) as z:
        for name,data in parts.items():z.writestr(name,data)
    print(file.name,'brand aligned; size, cells and formulas preserved.')
