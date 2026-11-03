"""Prepare render-only curve fonts without changing the website's font assets.

Blender's outline fill exposes overlapping TrueType contours as cutouts.
Union those contours in a temporary copy while preserving glyph advances.
"""
import argparse
import hashlib
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.ttLib.removeOverlaps import removeOverlaps


def prepare(source, destination):
    source, destination = Path(source), Path(destination)
    assert source.resolve() != destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    for weight in ['Regular', 'SemiBold']:
        name = f'UMSans-{weight}.ttf'
        path = source / name
        original_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        font = TTFont(path, recalcTimestamp=False)
        advances = {name: metrics[0] for name, metrics in font['hmtx'].metrics.items()}
        removeOverlaps(font, removeHinting=True)
        assert {name: metrics[0] for name, metrics in font['hmtx'].metrics.items()} == advances
        font.save(destination / name)
        assert hashlib.sha256(path.read_bytes()).hexdigest() == original_hash
        print(f'Render-only contours prepared: {name}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('destination')
    args = parser.parse_args()
    prepare(args.source, args.destination)
