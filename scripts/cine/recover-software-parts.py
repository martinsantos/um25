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
    slices_present=all(Path(f'software-part-{part}-{segment}/part-{part}-{segment}-info.json').is_file() for segment in range(1,5))
    if (out/f'part-{part}.mp4').is_file() and (out/f'part-{part}-info.json').is_file() and not slices_present:
        continue
    rows=[]
    for segment in range(1,5):
        folder=Path(f'software-part-{part}-{segment}')
        info=json.loads((folder/f'part-{part}-{segment}-info.json').read_text())
        fps=info.get('fps',24);chunk=fps*2;slice_frames=chunk//4
        frames=list(range((part-1)*chunk+(segment-1)*slice_frames,(part-1)*chunk+segment*slice_frames))
        assert [t['frame'] for t in info['timings']]==frames
        assert [b['frame'] for b in info['bounds']]==frames
        rows.append(info)
    identity=('scene','samples','engine','authoring_sha256','font_sha256','lighting')
    assert all(all(r.get(key)==rows[0].get(key) for key in identity) for r in rows),'Do not mix source, font or render revisions'
    info=dict(rows[0],timings=[t for r in rows for t in r['timings']],bounds=[b for r in rows for b in r['bounds']])
    if any('focus_bounds' in r for r in rows):
        info['focus_bounds']=[b for r in rows for b in r.get('focus_bounds',[])]
        info['handler_errors']=[error for r in rows for error in r.get('handler_errors',[])]
        assert not info['handler_errors'],info['handler_errors']
        expected_focus={(frame,group) for frame in range((part-1)*chunk,part*chunk) for group,(start,end) in info['focus_windows'].items() if start<=frame/(info['frames']-1)<=end}
        assert {(b['frame'],b['group']) for b in info['focus_bounds']}==expected_focus,'Missing focus evidence in recovered slices'
    out.mkdir(parents=True,exist_ok=True)
    (out/f'part-{part}-info.json').write_text(json.dumps(info))
    listing=Path(f'concat-{part}.txt')
    listing.write_text(''.join(f"file 'software-part-{part}-{s}/part-{part}-{s}.mp4'\n" for s in range(1,5)))
    movie=out/f'part-{part}.mp4'
    if not movie.exists():subprocess.run(['ffmpeg','-v','error','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(movie)],check=True)
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-of','json',str(movie)]))['streams'][0]
    assert (probe['width'],probe['height'],probe['nb_read_frames'],probe['avg_frame_rate'])==(*info.get('resolution',[1920,1080]),str(chunk),str(fps)+'/1')
    assert abs(float(probe['duration'])-2)<.01
    print(f'Recovered part {part}: {chunk} native frames from four existing slices')
