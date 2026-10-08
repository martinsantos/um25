"""Normalize the remaining authored models to the precision drawing palette.
Keeps their equipment and system topology; never replaces them with stock icons.
"""
from pathlib import Path
import xml.etree.ElementTree as ET
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
 for group in root.iter():
  if 'data-discipline-tag' in group.attrib:
   for child in list(group):
    if child.tag.endswith('circle'):group.remove(child)
    elif child.tag.endswith('text'):child.set('font-size','19');child.set('font-weight','400')
 for el in root.iter():
  tag=el.tag.split('}')[-1]
  for attr in ('fill','stroke'):
   if attr in el.attrib:el.set(attr,ink(el.attrib[attr],attr,tag))
 return ET.tostring(root,encoding='unicode')
for code in ('102','103','105','106','107','108'):
 out=refine((ROOT/f'discipline-{code}-v1.svg').read_text())
 (ROOT/f'discipline-{code}-v2.svg').write_text(out)
 print(code,len(out))
(ROOT/'discipline-systems-v2.svg').write_text(refine((ROOT/'discipline-systems-v1.svg').read_text()))
