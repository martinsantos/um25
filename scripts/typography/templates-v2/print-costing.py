"""Native print areas, repeating headers and validation error prompts."""
from pathlib import Path
from lxml import etree as E
import os,tempfile,zipfile
ROOT=Path(os.environ.get('UM_TEMPLATE_WORK',Path(tempfile.gettempdir())/'um-sans-template-build'))
S='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
def tag(n):return '{'+S+'}'+n
for file in [ROOT/'entrega/presupuesto-interno.xlsx',ROOT/'qa/costeo-prueba.xlsx']:
    with zipfile.ZipFile(file) as z:parts={n:z.read(n) for n in z.namelist()}
    # Column widths use the Normal font's digit metrics in native Office.
    # Match the corporate 12 pt font used by the authoring/rendering engine.
    styles=E.fromstring(parts['xl/styles.xml']);font=styles.find(tag('fonts'))[0]
    font.find(tag('name')).set('val','UM Sans 2');font.find(tag('sz')).set('val','12')
    parts['xl/styles.xml']=E.tostring(styles,xml_declaration=True,encoding='UTF-8',standalone=True)
    w=E.fromstring(parts['xl/workbook.xml']);names=w.find(tag('definedNames'))
    if names is None:names=E.SubElement(w,tag('definedNames'))
    for n in list(names):
        if n.get('name') in ['_xlnm.Print_Area','_xlnm.Print_Titles']:names.remove(n)
    for i,(name,area,paper) in enumerate([('Resultado','$A$1:$F$28','9'),('Costeo','$A$1:$L$43','8'),('Parámetros','$A$1:$F$34','8'),('Proveedores','$A$1:$L$47','8')],1):
        key=f'xl/worksheets/sheet{i}.xml';tree=E.fromstring(parts[key]);pr=tree.find(tag('sheetPr'))
        if pr is None:pr=E.Element(tag('sheetPr'));tree.insert(0,pr)
        setup=pr.find(tag('pageSetUpPr'))
        if setup is None:setup=E.SubElement(pr,tag('pageSetUpPr'))
        setup.set('fitToPage','1')
        for kind in ['pageMargins','pageSetup','headerFooter']:
            for old in tree.findall(tag(kind)):tree.remove(old)
        at=next((j for j,e in enumerate(tree) if E.QName(e).localname in ['drawing','legacyDrawing','extLst']),len(tree))
        nodes=[E.Element(tag('pageMargins'),left='0.4',right='0.4',top='0.35',bottom='0.4',header='0.15',footer='0.2'),E.Element(tag('pageSetup'),paperSize=paper,orientation='landscape',fitToWidth='1',fitToHeight='0')]
        footer=E.Element(tag('headerFooter'));E.SubElement(footer,tag('oddFooter')).text='&L&"UM Sans 2,Regular"&9ULTIMA MILLA S.A. · Uso interno&R&P / &N';nodes.append(footer)
        for node in nodes:tree.insert(at,node);at+=1
        for dv in tree.findall('.//'+tag('dataValidation')):
            dv.set('allowBlank','1');dv.set('showErrorMessage','1');dv.set('errorStyle','stop');dv.set('errorTitle','Revisar el valor');dv.set('error','Ingresar un valor dentro del rango permitido.')
        E.SubElement(names,tag('definedName'),name='_xlnm.Print_Area',localSheetId=str(i-1)).text=f"'{name}'!{area}"
        if name in ['Costeo','Proveedores']:E.SubElement(names,tag('definedName'),name='_xlnm.Print_Titles',localSheetId=str(i-1)).text=f"'{name}'!$13:$13"
        parts[key]=E.tostring(tree,xml_declaration=True,encoding='UTF-8',standalone=True)
    w.remove(names);at=next((j for j,e in enumerate(w) if E.QName(e).localname in ['calcPr','extLst']),len(w));w.insert(at,names)
    parts['xl/workbook.xml']=E.tostring(w,xml_declaration=True,encoding='UTF-8',standalone=True)
    with zipfile.ZipFile(file,'w',zipfile.ZIP_DEFLATED) as z:
        for n,data in parts.items():z.writestr(n,data)
    print(file.name,'print areas and repeated table headers applied')
