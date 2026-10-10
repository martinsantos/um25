"""OOXML print settings absent from the documented Artifact Tool API."""
from pathlib import Path
from copy import deepcopy
import zipfile
from lxml import etree as E
import os, tempfile
ROOT=Path(os.environ.get("UM_TEMPLATE_WORK",Path(tempfile.gettempdir())/"um-sans-template-build"))
REPO=Path(os.environ.get("UM_TEMPLATE_REPO",Path(__file__).resolve().parents[3]))
S='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
def tag(n):return '{'+S+'}'+n
for p in [ROOT/'entrega/oferta-economica.xlsx',ROOT/'qa/prueba-economica.xlsx',ROOT/'entrega/ejemplo-economico.xlsx']:
    if not p.exists():continue
    with zipfile.ZipFile(p) as z:files={n:z.read(n) for n in z.namelist()}
    sh=E.fromstring(files['xl/worksheets/sheet1.xml'])
    pr=sh.find(tag('sheetPr'))
    if pr is None:pr=E.Element(tag('sheetPr'));sh.insert(0,pr)
    page_pr=pr.find(tag('pageSetUpPr'))
    if page_pr is None:page_pr=E.SubElement(pr,tag('pageSetUpPr'))
    page_pr.set('fitToPage','1')
    for old in ['pageMargins','pageSetup','printOptions','headerFooter']:
        for e in sh.findall(tag(old)):sh.remove(e)
    # OOXML ordering places print settings before drawing relationships.
    idx=next((i for i,e in enumerate(sh) if E.QName(e).localname in ['drawing','legacyDrawing','extLst']),len(sh))
    margins=E.Element(tag('pageMargins'),left=str(25/25.4),right=str(20/25.4),top=str(13/25.4),bottom=str(16/25.4),header='0.2',footer='0.25')
    setup=E.Element(tag('pageSetup'),paperSize='9',orientation='portrait',fitToWidth='1',fitToHeight='0')
    footer=E.Element(tag('headerFooter'));E.SubElement(footer,tag('oddFooter')).text='&R&"UM Sans 2,Regular"&9&P / &N'
    for e in [margins,setup,footer]:sh.insert(idx,e);idx+=1
    for dv in sh.findall('.//'+tag('dataValidation')):
        dv.set('allowBlank','1');dv.set('showErrorMessage','1');dv.set('errorStyle','stop');dv.set('errorTitle','Revisar el valor');dv.set('error','Ingresar un valor permitido. Los importes y cantidades deben ser mayores o iguales que cero.')
    # A small native inset keeps descriptions away from the cell rule.
    # SpreadsheetML indent is not exposed by the Artifact Tool format API.
    styles=E.fromstring(files['xl/styles.xml']);xfs=styles.find(tag('cellXfs'));insets={}
    for cell in sh.findall('.//'+tag('c')):
        if cell.get('r') not in ({f'B{row}' for row in range(13,29)}|{'E11'}):continue
        old=int(cell.get('s','0'));alignment=xfs[old].find(tag('alignment'))
        if alignment is not None and alignment.get('indent')=='1':continue
        if old not in insets:
            xf=deepcopy(xfs[old]);alignment=xf.find(tag('alignment'))
            if alignment is None:alignment=E.SubElement(xf,tag('alignment'))
            alignment.set('horizontal','left');alignment.set('indent','1');xf.set('applyAlignment','1')
            insets[old]=len(xfs);xfs.append(xf)
        cell.set('s',str(insets[old]))
    xfs.set('count',str(len(xfs)))
    files['xl/styles.xml']=E.tostring(styles,xml_declaration=True,encoding='UTF-8',standalone=True)
    files['xl/worksheets/sheet1.xml']=E.tostring(sh,xml_declaration=True,encoding='UTF-8',standalone=True)
    w=E.fromstring(files['xl/workbook.xml']);names=w.find(tag('definedNames'))
    if names is None:names=E.SubElement(w,tag('definedNames'))
    for n in list(names):
        if n.get('name') in ['_xlnm.Print_Area','_xlnm.Print_Titles']:names.remove(n)
    E.SubElement(names,tag('definedName'),name='_xlnm.Print_Area',localSheetId='0').text="'Oferta económica'!$A$1:$F$38"
    E.SubElement(names,tag('definedName'),name='_xlnm.Print_Titles',localSheetId='0').text="'Oferta económica'!$13:$13"
    # definedNames precedes calcPr according to SpreadsheetML order.
    w.remove(names);i=next((i for i,e in enumerate(w) if E.QName(e).localname in ['calcPr','extLst']),len(w));w.insert(i,names)
    files['xl/workbook.xml']=E.tostring(w,xml_declaration=True,encoding='UTF-8',standalone=True)
    with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED) as z:
        for n,b in files.items():z.writestr(n,b)
    print(p.name,'A4 print settings applied')
