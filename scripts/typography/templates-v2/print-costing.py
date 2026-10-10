"""Native print areas, repeating headers and validation error prompts."""
from pathlib import Path
from lxml import etree as E
from copy import deepcopy
import os,tempfile,zipfile
ROOT=Path(os.environ.get('UM_TEMPLATE_WORK',Path(tempfile.gettempdir())/'um-sans-template-build'))
S='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
def tag(n):return '{'+S+'}'+n
for file in [ROOT/'entrega/presupuesto-interno.xlsx',ROOT/'qa/costeo-prueba.xlsx']:
    with zipfile.ZipFile(file) as z:parts={n:z.read(n) for n in z.namelist()}
    # OOXML column units use the Normal font's digit width. A widely available
    # metric font avoids a mismatch between print and spreadsheet preview.
    # Every working cell has an explicit UM Sans 2 12 pt font; titles use 20 pt.
    # Matching this metric keeps the raster and vector brand within the grid.
    styles=E.fromstring(parts['xl/styles.xml']);font=styles.find(tag('fonts'))[0]
    font.find(tag('name')).set('val','Arial');font.find(tag('sz')).set('val','12')
    # Text indentation in wrapped numeric headings differs across Office engines.
    # Reserve a glyph-width of space using Excel's native format syntax instead.
    fmts=styles.find(tag('numFmts'))
    if fmts is None:fmts=E.Element(tag('numFmts'));styles.insert(0,fmts)
    heading_fmt=max([int(f.get('numFmtId')) for f in fmts]+[163])+1
    E.SubElement(fmts,tag('numFmt'),numFmtId=str(heading_fmt),formatCode='General;General;General;@_W')
    fmts.set('count',str(len(fmts)))
    xfs=styles.find(tag('cellXfs'));aliases={};padded_formats={}
    def padded_format(fmt_id):
        # Calc ignores right indent on some numeric cells. Excel's underscore
        # spacer preserves the numeric value and reserves a consistent inset.
        if fmt_id not in padded_formats:
            original=next((f.get('formatCode') for f in fmts if int(f.get('numFmtId'))==fmt_id),None)
            if original is None:original={0:'General',1:'0',2:'0.00',9:'0%',10:'0.00%'}.get(fmt_id)
            if original is None:raise ValueError(f'Unsupported padded numeric format {fmt_id}')
            sections=original.split(';')
            sections=[section+'_W' for section in sections]
            if len(sections)<4:sections+=['@_W'] if len(sections)==3 else []
            new_id=max(int(f.get('numFmtId')) for f in fmts)+1
            E.SubElement(fmts,tag('numFmt'),numFmtId=str(new_id),formatCode=';'.join(sections))
            padded_formats[fmt_id]=new_id
        return padded_formats[fmt_id]
    def aligned(cell,horizontal,indent=1,nowrap=False):
        key=(int(cell.get('s','0')),horizontal,indent,nowrap)
        if key not in aliases:
            xf=deepcopy(xfs[key[0]]);a=xf.find(tag('alignment'))
            if a is None:a=E.SubElement(xf,tag('alignment'))
            a.set('horizontal',horizontal);a.set('vertical','center');a.set('indent',str(indent))
            if nowrap:
                a.set('wrapText','0');a.set('indent','0')
                xf.set('numFmtId',str(heading_fmt));xf.set('applyNumberFormat','1')
            elif horizontal=='right':
                a.set('indent','0')
                xf.set('numFmtId',str(padded_format(int(xf.get('numFmtId','0')))));xf.set('applyNumberFormat','1')
            xf.set('applyAlignment','1');aliases[key]=len(xfs);xfs.append(xf)
        cell.set('s',str(aliases[key]))
    w=E.fromstring(parts['xl/workbook.xml']);names=w.find(tag('definedNames'))
    if names is None:names=E.SubElement(w,tag('definedNames'))
    for n in list(names):
        if n.get('name') in ['_xlnm.Print_Area','_xlnm.Print_Titles']:names.remove(n)
    for i,(name,area,paper) in enumerate([('Resultado','$A$1:$F$28','9'),('Costeo','$A$1:$L$43','8'),('Parámetros','$A$1:$F$34','9'),('Proveedores','$A$1:$L$47','8')],1):
        key=f'xl/worksheets/sheet{i}.xml';tree=E.fromstring(parts[key]);pr=tree.find(tag('sheetPr'))
        for c in tree.findall('.//'+tag('sheetData')+'/'+tag('row')+'/'+tag('c')):
            address=c.get('r');column=''.join(x for x in address if x.isalpha());row=int(''.join(x for x in address if x.isdigit()))
            if name=='Resultado' and row in [7,8,10,11,13,14,15,16,17,20,21,22,23,24,25,27,28]:
                right=(column=='F' and row>=13) or (column=='D' and 13<=row<=17)
                aligned(c,'right' if right else 'left',nowrap=right and row==13)
            elif name=='Parámetros' and (row in [7,8,10,11,12,13,14,15,16,17,18,19,20,21,22,25,26,27,28,29]):
                aligned(c,'right' if column=='B' and row<26 and row!=8 else 'left')
            elif name in ['Costeo','Proveedores'] and 13<=row<=43:
                numeric=['F','H','I','J','K','L'] if name=='Costeo' else ['D','F','G','H','J','K']
                centered=['E','G'] if name=='Costeo' else ['C','E','I']
                if name=='Proveedores' and row==13 and column=='H':aligned(c,'center',0)
                else:aligned(c,'right' if column in numeric else 'center' if column in centered else 'left',0 if column in centered else 1,nowrap=row==13 and column in numeric)
            elif name=='Proveedores' and row in [7,8,46,47]:aligned(c,'right' if column=='K' else 'left')
        if name in ['Costeo','Proveedores']:
            pane=tree.find('.//'+tag('pane'))
            if pane is not None:
                pane.set('xSplit','2');pane.set('ySplit','13');pane.set('topLeftCell','C14');pane.set('activePane','bottomRight')
        if pr is None:pr=E.Element(tag('sheetPr'));tree.insert(0,pr)
        setup=pr.find(tag('pageSetUpPr'))
        if setup is None:setup=E.SubElement(pr,tag('pageSetUpPr'))
        setup.set('fitToPage','1')
        for kind in ['pageMargins','pageSetup','headerFooter']:
            for old in tree.findall(tag(kind)):tree.remove(old)
        at=next((j for j,e in enumerate(tree) if E.QName(e).localname in ['drawing','legacyDrawing','extLst']),len(tree))
        nodes=[E.Element(tag('pageMargins'),left='0.4',right='0.4',top='0.35',bottom='0.4',header='0.15',footer='0.2'),E.Element(tag('pageSetup'),paperSize=paper,orientation='landscape',fitToWidth='1',fitToHeight='0')]
        footer=E.Element(tag('headerFooter'));E.SubElement(footer,tag('oddFooter')).text='&L&"UM Sans 2,Regular"&9ULTIMA MILLA S.A. · Uso interno&R&"UM Sans 2,Regular"&9&P / &N';nodes.append(footer)
        for node in nodes:tree.insert(at,node);at+=1
        for dv in tree.findall('.//'+tag('dataValidation')):
            dv.set('allowBlank','1');dv.set('showErrorMessage','1');dv.set('errorStyle','stop');dv.set('errorTitle','Revisar el valor');dv.set('error','Ingresar un valor dentro del rango permitido.')
        E.SubElement(names,tag('definedName'),name='_xlnm.Print_Area',localSheetId=str(i-1)).text=f"'{name}'!{area}"
        if name in ['Costeo','Proveedores']:E.SubElement(names,tag('definedName'),name='_xlnm.Print_Titles',localSheetId=str(i-1)).text=f"'{name}'!$1:$13"
        parts[key]=E.tostring(tree,xml_declaration=True,encoding='UTF-8',standalone=True)
    w.remove(names);at=next((j for j,e in enumerate(w) if E.QName(e).localname in ['calcPr','extLst']),len(w));w.insert(at,names)
    parts['xl/workbook.xml']=E.tostring(w,xml_declaration=True,encoding='UTF-8',standalone=True)
    xfs.set('count',str(len(xfs)))
    fmts.set('count',str(len(fmts)))
    parts['xl/styles.xml']=E.tostring(styles,xml_declaration=True,encoding='UTF-8',standalone=True)
    with zipfile.ZipFile(file,'w',zipfile.ZIP_DEFLATED) as z:
        for n,data in parts.items():z.writestr(n,data)
    print(file.name,'print areas and repeated table headers applied')
