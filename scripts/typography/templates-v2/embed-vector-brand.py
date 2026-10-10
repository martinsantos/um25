"""Add Office SVG extensions with a visible, compatible PNG fallback.

SVGBlip: https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.office2019.drawing.svg.svgblip
The DrawingML extension is not exposed by the document/spreadsheet authoring APIs.
"""
from pathlib import Path, PurePosixPath
from lxml import etree as E
import os, tempfile, zipfile, sys
ROOT=Path(os.environ.get('UM_TEMPLATE_WORK',Path(tempfile.gettempdir())/'um-sans-template-build'))
A='http://schemas.openxmlformats.org/drawingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
P='http://schemas.openxmlformats.org/package/2006/relationships'
S='http://schemas.microsoft.com/office/drawing/2016/SVG/main'
C='http://schemas.openxmlformats.org/package/2006/content-types'
URI='{96DAC541-7B7A-43D3-8B79-37D633B846F1}'
logo=(ROOT/'logo.svg').read_bytes()
for file in sorted((ROOT/'entrega').iterdir()):
    if file.suffix not in ['.docx','.dotx','.xlsx']:continue
    if '--documents-only' in sys.argv and file.suffix=='.xlsx':continue
    if '--costing-only' in sys.argv and file.name!='presupuesto-interno.xlsx':continue
    with zipfile.ZipFile(file) as z:parts={n:z.read(n) for n in z.namelist()}
    prefix='xl' if file.suffix=='.xlsx' else 'word'
    parts[prefix+'/media/um-brand.svg']=logo
    targets=[n for n in parts if (n.startswith('word/header') or n.startswith('xl/drawings/drawing')) and n.endswith('.xml')]
    count=0
    for target in targets:
        tree=E.fromstring(parts[target]);blips=tree.findall('.//{'+A+'}blip')
        if not blips:continue
        assert len(blips)==1,(file,target,'unexpected images')
        path=PurePosixPath(target);rels_name=str(path.parent/'_rels'/(path.name+'.rels'))
        rels=E.fromstring(parts[rels_name]);rid='rIdUMVector'
        if not any(r.get('Id')==rid for r in rels):
            E.SubElement(rels,'{'+P+'}Relationship',Id=rid,Type=R+'/image',Target=('../media/um-brand.svg' if prefix=='xl' else 'media/um-brand.svg'))
        for blip in blips:
            if prefix=='xl':
                raster=next(r for r in rels if r.get('Target','').lower().endswith('.png'))
                assert not any(r is not raster and r.get('Id')=='rId1' for r in rels)
                raster.set('Id','rId1')
                raster.set('Target','../media/'+PurePosixPath(raster.get('Target')).name)
                blip.set('{'+R+'}embed','rId1')
            extensions=blip.find('{'+A+'}extLst')
            if extensions is None:extensions=E.SubElement(blip,'{'+A+'}extLst')
            for old in list(extensions):
                if old.get('uri')==URI:extensions.remove(old)
            extension=E.SubElement(extensions,'{'+A+'}ext',uri=URI)
            E.SubElement(extension,'{'+S+'}svgBlip',{'{'+R+'}embed':rid},nsmap={'asvg':S})
            count+=1
        parts[target]=E.tostring(tree,encoding='UTF-8',xml_declaration=True,standalone=True)
        parts[rels_name]=E.tostring(rels,encoding='UTF-8',xml_declaration=True,standalone=True)
    assert count==(4 if file.stem=='presupuesto-interno' else 1),(file,count)
    types=E.fromstring(parts['[Content_Types].xml'])
    if not any(t.get('Extension')=='svg' for t in types):E.SubElement(types,'{'+C+'}Default',Extension='svg',ContentType='image/svg+xml')
    parts['[Content_Types].xml']=E.tostring(types,encoding='UTF-8',xml_declaration=True,standalone=True)
    with zipfile.ZipFile(file,'w',zipfile.ZIP_DEFLATED) as z:
        for name,data in parts.items():z.writestr(name,data)
    print(file.name,'SVG + visible PNG fallback')
