"""Assemble v6 sector films from their 9 rendered parts and encode the scroll versions.

Parts are 30 fps MP4s already composited on the site background. Every part must exist,
come from the same renderer source and have the expected frame count; the assembled film
is decoded end to end before the scroll encodes are written.
"""
import argparse, hashlib, json, subprocess
from pathlib import Path

SCENES = {'building': 'fachada', 'clinic': 'hospital', 'terminal': 'aeropuerto', 'plant': 'planta', 'winery': 'bodega', 'mine': 'mineria'}
PARTS = range(0, 1080, 120)


def run(*args):
    subprocess.run(args, check=True)


def frames(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True)
    return int(out.stdout.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('parts', type=Path)
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--scrub', type=Path, required=True)
    ap.add_argument('--scenes', nargs='+', choices=list(SCENES), default=list(SCENES))
    a = ap.parse_args()
    a.output.mkdir(parents=True, exist_ok=True); a.scrub.mkdir(parents=True, exist_ok=True)
    report = {}
    for scene in a.scenes:
        slug = SCENES[scene]
        for comp in ['wide', 'mobile']:
            paths, sources = [], set()
            for start in PARTS:
                d = a.parts / f'sector-v6-{scene}-{comp}-{start}'
                info = json.loads((d / 'info.json').read_text())
                assert info['version'] == 'v6' and info['start'] == start, d
                sources.add(info['source_sha256'])
                assert frames(d / 'movie.mp4') == 60, d
                paths.append(d / 'movie.mp4')
            assert len(sources) == 1, f'mixed renderer revisions in {scene}/{comp}'
            listing = a.output / f'{scene}-{comp}.txt'
            listing.write_text(''.join(f"file '{p}'\n" for p in paths))
            film = a.output / f'cine-{slug}-proyecto-v6{"-sq" if comp == "mobile" else ""}.mp4'
            run('ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(listing), '-c', 'copy', '-movflags', '+faststart', str(film))
            run('ffmpeg', '-v', 'error', '-xerror', '-i', str(film), '-f', 'null', '-')
            assert frames(film) == 540, film
            # Scroll encodes: dense keyframes so seeking to any frame is instant.
            if comp == 'wide':
                scrub, vf, crf = a.scrub / f'{slug}-1600.mp4', 'scale=1600:900', '24'
            else:
                scrub, vf, crf = a.scrub / f'{slug}-sq-720.mp4', 'scale=720:720:flags=lanczos', '24'
            run('ffmpeg', '-v', 'error', '-y', '-i', str(film), '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-g', '3', '-keyint_min', '3', '-sc_threshold', '0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(scrub))
            poster = a.scrub / f'{slug}{"-sq" if comp == "mobile" else ""}-poster.jpg'
            run('ffmpeg', '-v', 'error', '-y', '-i', str(film), '-frames:v', '1', '-q:v', '2', str(poster))
            report[f'{scene}-{comp}'] = {'film': film.name, 'scrub': scrub.name, 'bytes': scrub.stat().st_size, 'source': sources.pop(), 'sha256': hashlib.sha256(scrub.read_bytes()).hexdigest()}
    print(json.dumps(report, indent=1))


if __name__ == '__main__':
    main()
