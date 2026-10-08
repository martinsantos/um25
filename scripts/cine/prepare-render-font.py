"""Normalize overlapping outlines only in a disposable Blender font copy."""
import argparse,hashlib,json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.ttLib.removeOverlaps import removeOverlaps

def prepare(source,output):
 source=Path(source).resolve();output=Path(output).resolve()
 assert source!=output and source.is_file() and not output.exists()
 original=source.read_bytes();font=TTFont(source,recalcTimestamp=False)
 cmap=font.getBestCmap().copy();advances={g:m[0] for g,m in font['hmtx'].metrics.items()}
 removeOverlaps(font,ignoreErrors=False)
 assert font.getBestCmap()==cmap and {g:m[0] for g,m in font['hmtx'].metrics.items()}==advances
 font.save(output)
 assert source.read_bytes()==original
 print(json.dumps({'source_sha256':hashlib.sha256(original).hexdigest(),'render_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'normalization':'union overlapping outlines; unchanged cmap and advances'}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');args=p.parse_args();prepare(args.source,args.output)
