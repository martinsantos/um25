from pathlib import Path
import shutil,zipfile,hashlib,json,subprocess,base64,re
from PIL import Image
from lxml import etree
import pdfplumber
import os, tempfile
ROOT=Path(os.environ.get("UM_TEMPLATE_WORK",Path(tempfile.gettempdir())/"um-sans-template-build"))
REPO=Path(os.environ.get("UM_TEMPLATE_REPO",Path(__file__).resolve().parents[3]));OUT=ROOT/'entrega'
for kind in ['oferta-completa','resumen-comercial','membrete','prueba-licitacion','ejemplo-licitacion','imagenes-documento']:
    shutil.copy2(ROOT/'qa/r2'/kind/(kind+'.pdf'),OUT/(kind+'.pdf'))
    if kind!='prueba-licitacion':
        im=Image.open(ROOT/'qa/r2'/kind/'page-1.png');im.thumbnail((1060,1500));im.save(OUT/(kind+'.webp'),quality=90)
shutil.copy2(ROOT/'qa/r2/excel-print/oferta-economica.pdf',OUT/'oferta-economica.pdf')
shutil.copy2(ROOT/'qa/r2/excel-print/ejemplo-economico.pdf',OUT/'ejemplo-economico.pdf')
shutil.copy2(ROOT/'qa/r2/excel-print/presupuesto-interno.pdf',OUT/'presupuesto-interno.pdf')
for kind in ['oferta-completa','resumen-comercial','membrete','oferta-economica','ejemplo-licitacion','ejemplo-economico','presupuesto-interno','imagenes-documento']:
    preview=OUT/(kind+'.svg')
    subprocess.run([os.environ.get('PDFTOCAIRO','pdftocairo'),'-svg','-f','1','-l','1',str(OUT/(kind+'.pdf')),str(preview)],check=True)
    # Keep the exact PDF geometry and original brand paths at every zoom level.
    svg=etree.parse(str(preview));ns={'s':'http://www.w3.org/2000/svg'}
    with pdfplumber.open(OUT/(kind+'.pdf')) as pdf:
        images=[im for im in pdf.pages[0].images if im['bottom']<70]
        assert images or len(pdf.pages[0].curves)>=18,(kind,'missing vector brand')
    if images:
        groups=svg.xpath('//s:g[@mask]',namespaces=ns);assert len(groups)==1,(kind,len(groups))
        box=images[0]
        brand=etree.parse(str(ROOT/'logo.svg')).getroot()
        for key,val in {'x':box['x0'],'y':box['top'],'width':box['x1']-box['x0'],'height':box['bottom']-box['top']}.items():brand.set(key,str(val))
        groups[0].getparent().replace(groups[0],brand)
        for unused in svg.xpath('//s:defs/s:image|//s:defs/s:mask',namespaces=ns):unused.getparent().remove(unused)
    paper=etree.Element('{'+ns['s']+'}rect',x='0',y='0',width='100%',height='100%',fill='#ffffff')
    svg.getroot().insert(1,paper)
    svg.write(str(preview),encoding='utf-8',xml_declaration=True)
fonts=OUT/'fuentes';fonts.mkdir(exist_ok=True)
BASE=REPO/'public/fonts/um-sans/v2.0.0'
for p in [BASE/'UMSans2-Regular.ttf',BASE/'UMSans2-Bold.ttf',BASE/'UMSans2-RegularItalic.ttf',BASE/'UMSans2-BoldItalic.ttf']:
    shutil.copy2(p,fonts/p.name)
for p in BASE.glob('*LICENSE*'):shutil.copy2(p,fonts/p.name)
for p in BASE.glob('*OFL*'):shutil.copy2(p,fonts/p.name)
guide='''PLANTILLAS ULTIMA MILLA — REVISIÓN 2026.10.10-r4

1. Instalar las cuatro fuentes TTF incluidas antes de abrir Excel o editar Word.
   Word también lleva las fuentes incrustadas. El PDF ya incorpora la tipografía.
2. Para un documento nuevo, abrir el DOTX. Para editar el ejemplo, abrir el DOCX.
3. Usar Título 1, Título 2 y Título 3 (Heading 1/2/3) para las secciones.
   La numeración 1., 1.1. y 1.1.1. es automática. No escribir números, tabulados
   ni espacios para simular sangrías. Al cambiar de nivel, aplicar el estilo.
4. Los números y el texto tienen el mismo tamaño: 16, 13 y 12 puntos.
   El cuerpo es de 12 puntos. Las tablas usan 10 puntos.
   La cifra comienza en la misma línea izquierda del cuerpo, dentro del bloque.
   Un espacio tipográfico separa número y título, sin saltos de tabulación.
5. En Excel, completar descripción, cantidad y precio unitario. La unidad es
   opcional. Los precios se calculan a dos decimales. Un renglón incompleto
   muestra «Completar» y evita un total parcial que parezca definitivo.
   Ingresar el importe total de impuestos; usar 0 cuando no corresponda.
6. Al agregar contenido extenso en Excel, ajustar el alto de la fila. La
   impresión admite páginas adicionales y repite el encabezado de la tabla.
7. Reemplazar los campos entre corchetes. Comprobar moneda, impuestos,
   condiciones, anexos y totales antes de exportar la oferta a PDF.
8. La edición y la impresión del HTML se verificaron en Google Chrome.
   Al imprimir, elegir A4, escala 100 % y desactivar los encabezados y pies
   añadidos por el navegador; la plantilla incluye su propia marca y paginado.

La prueba de licitación contiene texto ficticio para revisar títulos largos,
numeración de dos cifras y el tercer nivel 10.12.1. No es una oferta real.
El ejemplo-licitacion y el ejemplo-economico forman un mismo caso completo,
con datos ficticios y sin validez comercial. Sus importes coinciden.

Validación: PDF y LibreOffice; cálculos comprobados con datos de prueba.
La interacción de teclado específica de Microsoft Word y Microsoft Excel
no se ha probado en esas aplicaciones, que no están instaladas en esta Mac.

IMÁGENES EN DOCUMENTOS
El archivo imagenes-documento reúne bloques con PNG transparente, foto sobre
blanco y una imagen sin comentario. Las ilustraciones del sitio son referencias
de composición: no identifican modelos ni especificaciones de una oferta.
Copiar un bloque o reemplazar la imagen de la oferta completa. Mantener la
imagen en línea con el texto, centrada y con proporción bloqueada. No agregar
marcos, fondos, sombras ni recortar el producto. Usar imágenes de buena resolución.
Los estilos Imagen centrada y Comentario de imagen están en todas las variantes
Word. El comentario usa 10,5 pt y se mantiene junto a la imagen al cambiar de
página; eliminar su párrafo si no hace falta. El máximo es el ancho útil de la
hoja (165 mm). Para imágenes altas, reducir también la altura antes de exportar.
En HTML, Cambiar imagen permite elegir un PNG, JPG o WebP local; Guardar HTML
editado conserva la imagen incorporada y el comentario. El botón no se imprime.

PRESUPUESTO INTERNO
Resultado, Costeo, Parámetros y Proveedores trabajan en un mismo libro vacío.
Completar primero Parámetros, luego los componentes por renglón / código y
sector / piso en Costeo. Los márgenes se calculan sobre la venta. Los ajustes
se aplican en este orden: imprevistos, bonificación y, sobre el neto, IVA.
Los valores de impuestos y cotización deben comprobarse para cada oferta.
DH y HH usan la tarifa de Parámetros cuando el costo unitario está vacío y
la moneda es USD. Un costo manual tiene prioridad. En Proveedores, comparar
precios en la misma moneda y elegir A o B; trasladar el precio elegido al
Costeo con su código. No se transfieren precios automáticamente entre esas
hojas. Resultado y Parámetros imprimen en A4 apaisada; Costeo y Proveedores
en A3 apaisada. El libro vacío imprime cuatro páginas, una por hoja, con
cuerpo de 12 puntos sin reducir la escala. Los encabezados y las dos primeras
columnas permanecen visibles al desplazarse. Para textos que ocupen más de
una línea, ajustar el alto de la fila antes de imprimir.
Este libro contiene costos internos: entregar al cliente sólo la oferta.

MARCA EN EXCEL
La imagen principal es un PNG visible con suavizado sobre fondo blanco.
Office también dispone del SVG para la impresión. El visor del usuario no
mostró la variante que usaba SVG como imagen principal; esa variante se descartó.
LibreOffice y PDF se verificaron. Microsoft Excel y el visor integrado
requieren control directo adicional; no impiden esta entrega autorizada.
'''
(OUT/'LEEME.txt').write_text(guide)
files=[p for p in OUT.rglob('*') if p.is_file() and p.suffix in ['.docx','.dotx','.odt','.html','.pdf','.svg','.webp','.xlsx','.ttf','.txt']]
manifest={'version':'2026.10.10-r4','fontVersion':'2.0.0','status':'validada-libreoffice-pdf','files':[{'path':str(p.relative_to(OUT)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)]}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
with zipfile.ZipFile(OUT/'Plantillas-UMSans2-2026.10.10-r4.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in files+[OUT/'manifest.json']:z.write(p,p.relative_to(OUT))
dest=REPO/'public/downloads/plantillas-um-sans/2026.10.10-r4';dest.mkdir(parents=True,exist_ok=True)
for p in files+[OUT/'manifest.json',OUT/'Plantillas-UMSans2-2026.10.10-r4.zip']:
    target=dest/p.relative_to(OUT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
print('Paquete local:',len(files),'archivos;',round((OUT/'Plantillas-UMSans2-2026.10.10-r4.zip').stat().st_size/1024/1024,2),'MB')
