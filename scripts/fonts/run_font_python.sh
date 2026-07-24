#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENV="$ROOT/.venv-fonts"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if [[ ! -x "$VENV/bin/python" ]]; then
  "$PYTHON_BIN" -m venv "$VENV"
fi

if ! "$VENV/bin/python" -c 'import fontTools, brotli, ttfautohint, fontbakery' >/dev/null 2>&1; then
  "$VENV/bin/python" -m pip install \
    --disable-pip-version-check \
    --requirement "$ROOT/scripts/fonts/requirements.txt"
fi

exec "$VENV/bin/python" "$@"
