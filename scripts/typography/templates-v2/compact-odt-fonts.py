"""Keep corporate embedded fonts; discard unused system-font payloads."""
from pathlib import Path
from lxml import etree as E
import os,tempfile,zipfile
ROOT=Path(os.environ.get('UM_TEMPLATE_WORK',Path(tempfile.gettempdir())/'um-sans-template-build'))
NS={'s':'urn:oasis:names:tc:opendocument:xmlns:style:1.0','v':'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0','x':'http://www.w3.org/1999/xlink','m':'urn:oasis:names:tc:opendocument:xmlns:manifest:1.0'}
for file in sorted((ROOT/'entrega').glob('*.odt')):
    before=file.stat().st_size
    with zipfile.ZipFile(file) as z:parts={n:z.read(n) for n in z.namelist()}
    keep=set()
    for name in ['styles.xml','content.xml']:
        tree=E.fromstring(parts[name])
        for face in tree.findall('.//s:font-face',NS):
            family=face.get('{'+NS['v']+'}font-family','').strip("'")
            if family!='UM Sans 2':
                for src in face.findall('v:font-face-src',NS):face.remove(src)
            keep.update(face.xpath('.//@x:href',namespaces=NS))
        parts[name]=E.tostring(tree,encoding='UTF-8',xml_declaration=True)
    unused={n for n in parts if n.startswith('Fonts/') and n not in keep}
    manifest=E.fromstring(parts['META-INF/manifest.xml'])
    for entry in list(manifest):
        if entry.get('{'+NS['m']+'}full-path') in unused:manifest.remove(entry)
    parts['META-INF/manifest.xml']=E.tostring(manifest,encoding='UTF-8',xml_declaration=True)
    with zipfile.ZipFile(file,'w') as z:
        z.writestr('mimetype',parts['mimetype'],compress_type=zipfile.ZIP_STORED)
        for name,data in parts.items():
            if name!='mimetype' and name not in unused:z.writestr(name,data,compress_type=zipfile.ZIP_DEFLATED)
    print(file.name,before,'→',file.stat().st_size,'bytes; four UM Sans 2 fonts retained')
