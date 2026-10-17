"""Declare the existing YUV matrix and sRGB appearance without re-encoding frames.
The native Blender PNGs were encoded by swscale with BT.601 coefficients. H.264
was left untagged, so the browser guessed BT.709 for HD and shifted UM red.
All three independent color fields are explicit. Compressed image slices stay intact.
"""
import argparse,hashlib,json,shutil,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');a=p.parse_args()
source,out=Path(a.source),Path(a.output);out.mkdir(parents=True,exist_ok=True)
info=json.loads((source/'render-info.json').read_text());assert info['scene']=='software-system-v3'
info['scene']='software-system-v4';info['sourceGeometry']='software-system-v3'
info['colorProfile']={'matrix':'smpte170m','primaries':'bt709','transfer':'iec61966-2-1','range':'tv','operation':'H.264 VUI and container metadata; compressed image slices preserved'}
for suffix,label in [('', ''),('-sq','-square')]:
 before=source/f'cine-software-system-v3{suffix}.mp4';after=out/f'cine-software-system-v4{suffix}.mp4'
 assert not after.exists()
 subprocess.run(['ffmpeg','-v','error','-i',str(before),'-map','0:v:0','-c:v','copy','-bsf:v','h264_metadata=video_full_range_flag=0:colour_primaries=1:transfer_characteristics=13:matrix_coefficients=6','-color_range','tv','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','smpte170m','-movflags','+faststart',str(after)],check=True)
 v=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(after)]))
 stream=v['streams'][0]
 assert (stream['nb_read_frames'],stream['avg_frame_rate'])==('1440','60/1')
 for field,value in [('color_space','smpte170m'),('color_transfer','iec61966-2-1'),('color_primaries','bt709'),('color_range','tv')]:assert stream[field]==value
 (out/f'validation{label}.json').write_text(json.dumps(v))
for suffix in ['-poster.jpg','-poster.avif','-poster-sq.jpg','-poster-sq.avif']:
 shutil.copyfile(source/f'cine-software-system-v3{suffix}',out/f'cine-software-system-v4{suffix}')
# Compare decoded YUV planes with the original integrity manifest, not just counts.
subprocess.run(['ffmpeg','-v','error','-i',str(out/'cine-software-system-v4.mp4'),'-f','framemd5',str(out/'frame-integrity.txt')],check=True)
def frames(file):return [line.split(',')[-1].strip() for line in file.read_text().splitlines() if line and not line.startswith('#')]
assert frames(source/'frame-integrity.txt')==frames(out/'frame-integrity.txt'),'Pixel planes changed during metadata repair'
(out/'render-info.json').write_text(json.dumps(info));shutil.copyfile(source/'frame-summary.json',out/'frame-summary.json')
(out/'color-validation.json').write_text(json.dumps({'decoded_frames_unchanged':1440,'source_sha256':hashlib.sha256((source/'cine-software-system-v3.mp4').read_bytes()).hexdigest(),'profile':info['colorProfile']}))
(out/'SHA256SUMS').write_text(''.join(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.name+'\n' for f in sorted(out.iterdir()) if f.name!='SHA256SUMS'))
print('Repacked 4K/60 and mobile delivery; all 1440 decoded frames unchanged')
