#!/usr/bin/env python3
"""Fetch and verify the pinned OFL source masters used by UM Sans.

The sources are cached outside version control. Every download is tied to a
specific Google Fonts commit and SHA-256 digest so a build cannot silently move
to a different Inter release.
"""

from __future__ import annotations

import hashlib
import json
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / ".font-sources" / "um-sans"
GOOGLE_FONTS_COMMIT = "ec0464b978de222073645d6d3366f3fdf03376d8"
BASE_URL = f"https://raw.githubusercontent.com/google/fonts/{GOOGLE_FONTS_COMMIT}/ofl/inter"

SOURCES = {
    "Inter[opsz,wght].ttf": {
        "url": f"{BASE_URL}/Inter%5Bopsz%2Cwght%5D.ttf",
        "sha256": "29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031",
    },
    "Inter-Italic[opsz,wght].ttf": {
        "url": f"{BASE_URL}/Inter-Italic%5Bopsz%2Cwght%5D.ttf",
        "sha256": "acd98e64795781b2058f07b18475e0ecee2a0fe2b42a49e2f9e37d0d6bf66ce6",
    },
    "OFL.txt": {
        "url": f"{BASE_URL}/OFL.txt",
        "sha256": "5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57",
    },
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fetch_sources() -> dict[str, object]:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    files: list[dict[str, object]] = []

    for filename, source in SOURCES.items():
        destination = SOURCE_DIR / filename
        if not destination.exists() or digest(destination) != source["sha256"]:
            request = urllib.request.Request(
                source["url"],
                headers={"User-Agent": "UMSA-font-build/1.2"},
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                destination.write_bytes(response.read())

        actual_digest = digest(destination)
        if actual_digest != source["sha256"]:
            destination.unlink(missing_ok=True)
            raise RuntimeError(f"Source checksum mismatch: {filename}")

        files.append(
            {
                "file": filename,
                "bytes": destination.stat().st_size,
                "sha256": actual_digest,
                "url": source["url"],
            }
        )

    manifest = {
        "upstream": "Inter",
        "upstreamVersion": "4.001",
        "license": "SIL OFL 1.1",
        "googleFontsCommit": GOOGLE_FONTS_COMMIT,
        "files": files,
    }
    (SOURCE_DIR / "source-manifest.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )
    return manifest


if __name__ == "__main__":
    print(json.dumps(fetch_sources(), indent=2))
