"""Populate the approved native template with a clearly fictional tender.

Only document.xml changes; numbering, font embedding and vector brand survive.
The companion workbook uses the same example-tender.json inputs.
"""
from pathlib import Path
from copy import deepcopy
from decimal import Decimal, ROUND_HALF_UP
from lxml import etree as E
import os, tempfile, json, zipfile

ROOT=Path(os.environ.get('UM_TEMPLATE_WORK',Path(tempfile.gettempdir())/'um-sans-template-build'))
DATA=json.loads(Path(__file__).with_name('example-tender.json').read_text())
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
q=lambda t:'{'+W+'}'+t
def text(p):
    nodes=p.xpath('.//w:r//w:t|.//w:r//w:tab|.//w:r//w:br',namespaces={'w':W})
    return ''.join(n.text or '' if n.tag==q('t') else '\t' if n.tag==q('tab') else '\n' for n in nodes)
def write(p,value):
    if '\t' in value and '\t' in text(p):
        # Keep the small label and the 12 pt value as separate styled runs.
        nodes=p.xpath('.//w:r/w:t',namespaces={'w':W})
        targets=[node for node in nodes if '[' in (node.text or '')]
        assert len(targets)==1
        targets[0].text=value.split('\t',1)[1]
        return
    rpr=p.find('.//'+q('rPr'))
    for n in list(p):
        if n.tag!=q('pPr'):p.remove(n)
    style=p.find('.//'+q('pStyle'))
    if style is not None and style.get(q('val'))=='Comentariodeimagen':
        label,sep,comment=value.partition('. ')
        for part,bold in [(label+('. ' if sep else ''),True),(comment,False)]:
            if not part:continue
            r=E.SubElement(p,q('r'));rp=E.SubElement(r,q('rPr'))
            if bold:E.SubElement(rp,q('b'))
            E.SubElement(r,q('t'),{'{http://www.w3.org/XML/1998/namespace}space':'preserve'}).text=part
        return
    r=E.SubElement(p,q('r'))
    if rpr is not None:r.append(deepcopy(rpr))
    import re
    for bit in re.split(r'(\n|\t)',value):
        if bit in ['\n','\t']:E.SubElement(r,q('br' if bit=='\n' else 'tab'))
        elif bit:
            node=E.SubElement(r,q('t'));node.set('{http://www.w3.org/XML/1998/namespace}space','preserve');node.text=bit
def money(n):
    return f'{Decimal(str(n)):,.2f}'.replace(',','_').replace('.',',').replace('_','.')
items=DATA['items'];amounts=[(Decimal(str(i['quantity']))*Decimal(str(i['price']))).quantize(Decimal('.01'),rounding=ROUND_HALF_UP) for i in items]
subtotal=sum(amounts);total=subtotal+Decimal(str(DATA['tax']))
assert subtotal==Decimal('5294.12') and total==Decimal('5504.12')
replace={
 'LICITACIÓN [NÚMERO]  ·  EXPEDIENTE [REFERENCIA]':'EJEMPLO FICTICIO · DEMO-2026/01 · SIN VALIDEZ COMERCIAL',
 '[Objeto de la contratación]':'Red de datos y puesta en servicio del Centro Operativo Cuyo',
 'Destinatario\t[Organismo o cliente]':'Destinatario\t'+DATA['client'],
 'Proyecto\t[Nombre del proyecto]':'Proyecto\t'+DATA['project'],
 'Fecha\t[DD/MM/AAAA]':'Fecha\t09/10/2026',
 '[Identificar al oferente, el objeto de la propuesta y la documentación que integra la presentación.]':'Esta oferta de ejemplo reúne el alcance técnico, el plan de trabajo y la inversión para la red de datos de un centro operativo ficticio. Incluye instalación, configuración, pruebas y documentación de entrega.',
 '[Describir los bienes y servicios incluidos, las cantidades y los límites de la prestación.]':'Se prevé instalar dos equipos de acceso, conectar doce enlaces y configurar la red del centro. La prestación comprende el inventario inicial, la identificación de puertos y la verificación de conectividad de los puestos incluidos.',
 '[Indicar dependencias y prestaciones no incluidas, sin contradecir el pliego.]':'El centro facilitará acceso a las salas técnicas, energía y los puntos de conexión existentes. Las obras civiles, los enlaces del proveedor de internet y los equipos de usuario quedan fuera del alcance de este ejemplo.',
 '[Describir la solución, sus componentes y las especificaciones ofrecidas.]':'Los equipos de acceso se conectarán al núcleo existente. La configuración separará la operación de la administración y registrará los puertos, las direcciones y los parámetros acordados. El plano final reflejará la instalación ejecutada.',
 '[Detallar las condiciones necesarias y las verificaciones previas a la puesta en servicio.]':'Antes de intervenir se comprobarán alimentación, espacio de montaje y disponibilidad de los enlaces. La puesta en servicio se realizará en una ventana acordada, con una copia de la configuración previa y una secuencia de retorno.',
 '[Producto o componente]. [Comentario opcional de la imagen. Eliminar este párrafo si no corresponde.]':'Panel de conexiones. Imagen de referencia para los enlaces de acceso del ejemplo. No identifica un modelo ni una prestación ofrecida.',
 'Moneda: [Completar]    Tratamiento de impuestos: [Completar]':'Moneda: USD    Impuestos simulados del ejemplo: USD 210,00',
 'Subtotal: [Importe]\nImpuestos: [Importe]\nTotal de la oferta: [Moneda e importe]':f'Subtotal: USD {money(subtotal)}\nImpuestos del ejemplo: USD {money(DATA["tax"])}\nTotal de la oferta: USD {money(total)}',
 '[Adjuntar el detalle de la planilla económica y verificar que coincida con los totales de esta propuesta.]':'La planilla económica adjunta contiene los mismos tres renglones y totales. Todos los importes son ficticios y sirven para comprobar la composición y el cálculo de las plantillas.',
 '[Completar el plazo y su fecha de cómputo conforme a la contratación.]':'Para este ejemplo se utiliza una validez de treinta días desde la fecha de emisión. El modelo no constituye una oferta comercial.',
 '[Detallar forma de pago, hitos, lugar y plazo de entrega.]':'El ejemplo contempla pago a la aceptación y entrega en las instalaciones del centro, diez días hábiles después de habilitar el acceso y confirmar la ventana de intervención.',
 '[Precisar cobertura, vigencia, canales de atención y exclusiones aplicables.]':'La documentación de entrega incluirá el canal de contacto y las condiciones de atención acordadas para la instalación. No se presupuestan prestaciones de soporte permanente en este ejemplo.',
 '[Enumerar los anexos exigidos y completar nombre, cargo y datos de contacto del responsable.]':'Anexos del ejemplo: plan de trabajo, inventario, plano de red y planilla económica. Referente: Equipo de Proyectos del Centro Operativo Cuyo, una organización ficticia utilizada para mostrar el documento completo.'
}
source=ROOT/'entrega/oferta-completa.docx';target=ROOT/'entrega/ejemplo-licitacion.docx'
with zipfile.ZipFile(source) as z:parts={n:z.read(n) for n in z.namelist()}
doc=E.fromstring(parts['word/document.xml']);body=doc.find(q('body'))
for p in body.findall(q('p')):
    value=text(p)
    if value in replace:write(p,replace[value])
    if value in ['Oferta económica','Condiciones comerciales y documentación']:
        ppr=p.find(q('pPr'))
        if ppr is None:ppr=E.Element(q('pPr'));p.insert(0,ppr)
        if ppr.find(q('pageBreakBefore')) is None:E.SubElement(ppr,q('pageBreakBefore'))
tables=body.findall(q('tbl'))
contents=[
 [['2.1 · Alcance','Dos equipos de acceso y doce enlaces incluidos.'],['3.2 · Entrega','Inventario, plano de red y acta de pruebas.']],
 [['Configuración y plano de red','Copia de configuración y plano conforme a la instalación.'],['Pruebas de conectividad','Registro de resultados y acta de aceptación.']],
 [['Relevamiento y preparación','Días 1 y 2','Equipo de proyectos'],['Instalación, pruebas y entrega','Días 3 a 10','Equipo técnico']],
 [[str(index+1),i['description'],str(i['quantity']),money(i['price']),money(amounts[index])] for index,i in enumerate(items)]
]
assert len(tables)==len(contents)
for table,rows in zip(tables,contents):
    trs=table.findall(q('tr'))
    while len(trs)-1<len(rows):table.append(deepcopy(trs[-1]));trs=table.findall(q('tr'))
    for tr,values in zip(trs[1:],rows):
        cells=tr.findall(q('tc'));assert len(cells)==len(values)
        for cell,value in zip(cells,values):write(cell.find(q('p')),value)
assert '[' not in text(body),'Unfilled example field'
parts['word/document.xml']=E.tostring(doc,encoding='UTF-8',xml_declaration=True,standalone=True)
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for name,value in parts.items():z.writestr(name,value)
with zipfile.ZipFile(source) as before,zipfile.ZipFile(target) as after:
    assert [n for n in before.namelist() if before.read(n)!=after.read(n)]==['word/document.xml']
print('Complete fictional tender:',target)
