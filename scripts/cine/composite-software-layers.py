"""Composite native, identically framed Blender passes in linear-light RGB."""
import sys
from pathlib import Path
from PIL import Image
import numpy as np
folder=Path(sys.argv[1]);frame=int(sys.argv[2]);opacity=float(sys.argv[3]);assert 0<=opacity<=1
# Work in linear light to avoid a dark fringe around fine glyph contours.
def linear(x):return np.where(x<=.04045,x/12.92,((x+.055)/1.055)**2.4)
def read(name):
 a=np.asarray(Image.open(folder/f'layer-{name}.png').convert('RGBA'),dtype=np.float32)/255
 return linear(a[:,:,:3]),a[:,:,3:4]
base,ba=read('base')
for name,weight in [('glass',opacity),('front',1)]:
 rgb,a=read(name);a*=weight;base=rgb*a+base*(1-a)
srgb=np.where(base<=.0031308,12.92*base,1.055*np.maximum(base,0)**(1/2.4)-.055)
Image.fromarray(np.rint(np.clip(srgb,0,1)*255).astype('uint8')).save(folder/f'{frame:04d}.png')
