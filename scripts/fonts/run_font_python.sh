#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENV="$ROOT/.venv-fonts"
PYTHON_BIN="${PYTHON_BIN:-python3}"

# CI and isolated visual-audit environments can provide a prebuilt interpreter
# with the pinned font stack. In that case never create a local venv or reach
# the network: a type release gate must be reproducible offline.
if [[ -n "${UMSANS_FONT_PYTHON:-}" ]]; then
  if [[ ! -x "$UMSANS_FONT_PYTHON" ]]; then
    echo "UMSANS_FONT_PYTHON is not executable: $UMSANS_FONT_PYTHON" >&2
    exit 2
  fi
  exec "$UMSANS_FONT_PYTHON" "$@"
fi

if [[ ! -x "$VENV/bin/python" ]]; then
  "$PYTHON_BIN" -m venv "$VENV"
fi

if ! "$VENV/bin/python" -c 'import fontTools, brotli, ttfautohint, fontbakery' >/dev/null 2>&1; then
  "$VENV/bin/python" -m pip install \
    --disable-pip-version-check \
    --requirement "$ROOT/scripts/fonts/requirements.txt"
fi

exec "$VENV/bin/python" "$@"
