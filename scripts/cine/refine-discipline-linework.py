"""Normalize the remaining authored models to the precision drawing palette.
Keeps their equipment and system topology; never replaces them with stock icons.
"""
from pathlib import Path
import xml.etree.ElementTree as ET
import runpy
interfaces=runpy.run_path(str(Path(__file__).with_name('precision-diagram-content.py')))
CONTENT=interfaces['CONTENT'];MONITORS=interfaces['MONITORS']
ROOT=Path(__file__).resolve().parents[2]/'src/assets/cine/isometric'
ET.register_namespace('', 'http://www.w3.org/2000/svg')

def ink(value,attr,tag):
 if not(value.startswith('#') and len(value)==7):return value
 rgb=[int(value[i:i+2],16) for i in (1,3,5)];r,g,b=rgb
 red=r>g*1.25 and r>b*1.2 and r>95
 if attr=='stroke':return '#dc2626' if red else '#a2a8af' if max(rgb)>205 else '#81878e' if max(rgb)>145 else '#646b73'
 if tag in ('text','tspan'):return '#c4c7cc'
 if red:return '#481d24' if tag in ('polygon','path') else '#b83a3e'
 brightness=sum(rgb)/3
 return '#0c0f12' if brightness<37 else '#111316' if brightness<90 else '#16191d' if brightness<180 else '#1c2025'

def refine(source):
 root=ET.fromstring(source)
 for drawing in root.iter():
  code=drawing.get('data-discipline-drawing')
  if not code:continue
  for node in drawing.iter():
   key=(code,int(node.get('data-discipline-node','-1')))
   if key in MONITORS:
    screen=next((el for el in node.iter() if el.get('transform','')=='translate(-9 -130) matrix(.8660254 .5 0 1 0 0)'),None)
    if screen is not None:
     for child in list(screen):screen.remove(child)
     screen.extend(list(ET.fromstring('<svg xmlns="http://www.w3.org/2000/svg">'+MONITORS[key]+'</svg>')));screen.set('data-authored-interface','true')
   if key not in CONTENT:continue
   surface=next((el for el in node.iter() if el.get('transform','').startswith('matrix(.8660254 .5 -.8660254 .5')),None)
   if surface is None:continue
   for child in list(surface):surface.remove(child)
   fragment=ET.fromstring('<svg xmlns="http://www.w3.org/2000/svg">'+CONTENT[key]+'</svg>')
   surface.extend(list(fragment));surface.set('data-authored-interface','true')
 for group in root.iter():
  if 'data-discipline-tag' in group.attrib:
   for child in list(group):
    if child.tag.endswith('circle'):group.remove(child)
    elif child.tag.endswith('text'):child.set('font-size','19');child.set('font-weight','400')
 authored={el for surface in root.iter() if surface.get('data-authored-interface')=='true' for el in surface.iter()}
 for el in root.iter():
  if el in authored:continue
  tag=el.tag.split('}')[-1]
  for attr in ('fill','stroke'):
   if attr in el.attrib:el.set(attr,ink(el.attrib[attr],attr,tag))
 return ET.tostring(root,encoding='unicode')
for code in ('102','103','105','106','107','108'):
 out=refine((ROOT/f'discipline-{code}-v1.svg').read_text())
 (ROOT/f'discipline-{code}-v2.svg').write_text(out)
 print(code,len(out))
(ROOT/'discipline-systems-v2.svg').write_text(refine((ROOT/'discipline-systems-v1.svg').read_text()))

# The contextual installation shares the same ink hierarchy as its close-up.
for source in ROOT.glob('site-*-v1.svg'):
 (ROOT/(source.name.replace('-v1.svg','-v2.svg'))).write_text(refine(source.read_text()))
