#!/usr/bin/env python3
"""Run the external FontBakery release gate and repackage its evidence."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from package_um_sans import package_release


ROOT = Path(__file__).resolve().parents[2]
FONT_DIR = ROOT / "public" / "fonts" / "um-sans"
VENV = ROOT / ".venv-fonts"
FONTBAKERY = VENV / "bin" / "fontbakery"
JSON_REPORT = FONT_DIR / "fontbakery-report.json"
MARKDOWN_REPORT = FONT_DIR / "fontbakery-report.md"


def main() -> None:
    fonts = sorted(
        path
        for path in FONT_DIR.glob("UMSans-*.ttf")
        if path.is_file()
    )
    command = [
        str(FONTBAKERY),
        "check-universal",
        "--skip-network",
        "--no-progress",
        "--no-colors",
        "--succinct",
        # FontBakery's family-axis check includes static files as `None` when a
        # mixed static/variable family is passed. The custom gate compares both
        # variable ranges directly, so exclude that known mixed-input false
        # positive here while retaining every other universal check.
        "--exclude-checkid",
        "opentype/varfont/family_axis_ranges",
        "--json",
        str(JSON_REPORT),
        "--ghmarkdown",
        str(MARKDOWN_REPORT),
        *map(str, fonts),
    ]
    completed = subprocess.run(command, check=False)
    if not JSON_REPORT.exists():
        raise RuntimeError(f"FontBakery did not create {JSON_REPORT}")
    report = json.loads(JSON_REPORT.read_text(encoding="utf-8"))
    counts = report.get("result", {})
    package_release()
    blocking = sum(int(counts.get(status, 0)) for status in ("ERROR", "FATAL", "FAIL"))
    print(json.dumps({"fonts": len(fonts), "result": counts}, indent=2))
    if completed.returncode and not blocking:
        raise SystemExit(completed.returncode)
    if blocking:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
