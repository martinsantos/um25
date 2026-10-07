import argparse,json,subprocess
from pathlib import Path
parser=argparse.ArgumentParser(description='Join existing verified Blender slices without rendering')
parser.add_argument('--parts',default=','.join(map(str,range(1,13))))
parser.add_argument('--output',default='.')
args=parser.parse_args()
parts=[int(p) for p in args.parts.split(',')]
assert len(parts)==len(set(parts)) and all(1<=p<=12 for p in parts)
for part in parts:
    out=Path(args.output)/f'software-part-{part}'
    if (out/f'part-{part}.mp4').is_file() and (out/f'part-{part}-info.json').is_file():
        continue
    rows=[]
    for segment in range(1,5):
        folder=Path(f'software-part-{part}-{segment}')
        info=json.loads((folder/f'part-{part}-{segment}-info.json').read_text())
        frames=list(range((part-1)*48+(segment-1)*12,(part-1)*48+segment*12))
        assert [t['frame'] for t in info['timings']]==frames
        assert [b['frame'] for b in info['bounds']]==frames
        rows.append(info)
    assert all(r['scene']==rows[0]['scene'] and r['samples']==rows[0]['samples'] and r['engine']==rows[0]['engine'] for r in rows)
    info=dict(rows[0],timings=[t for r in rows for t in r['timings']],bounds=[b for r in rows for b in r['bounds']])
    out.mkdir(parents=True,exist_ok=True)
    (out/f'part-{part}-info.json').write_text(json.dumps(info))
    listing=Path(f'concat-{part}.txt')
    listing.write_text(''.join(f"file 'software-part-{part}-{s}/part-{part}-{s}.mp4'\n" for s in range(1,5)))
    movie=out/f'part-{part}.mp4'
    subprocess.run(['ffmpeg','-v','error','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(movie)],check=True)
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-of','json',str(movie)]))['streams'][0]
    assert (probe['width'],probe['height'],probe['nb_read_frames'],probe['avg_frame_rate'])==(1920,1080,'48','24/1')
    assert abs(float(probe['duration'])-2)<.01
    print(f'Recovered part {part}: 48 frames from four existing slices')
