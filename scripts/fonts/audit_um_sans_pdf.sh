#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
URL="${UM_SANS_SPECIMEN_URL:-http://localhost:4322/estilo/um-sans}"
PUBLISHED_OUT="$ROOT/public/fonts/um-sans/specimen-audit.pdf"
OUT="${UM_SANS_PDF_OUT:-$PUBLISHED_OUT}"
CHROME_BIN="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PROFILE="$(mktemp -d /tmp/um-sans-pdf-profile.XXXXXX)"
CHROME_PID=""

cleanup() {
  if [[ -n "$CHROME_PID" ]]; then
    kill "$CHROME_PID" >/dev/null 2>&1 || true
    wait "$CHROME_PID" >/dev/null 2>&1 || true
  fi
  pkill -f "$PROFILE" >/dev/null 2>&1 || true
  rm -rf "$PROFILE"
}
trap cleanup EXIT

for command in curl pdfinfo pdffonts; do
  command -v "$command" >/dev/null || {
    echo "Missing PDF audit dependency: $command" >&2
    exit 1
  }
done

test -x "$CHROME_BIN" || {
  echo "Chrome not found at $CHROME_BIN" >&2
  exit 1
}

curl --fail --silent --show-error "$URL" >/dev/null
mkdir -p "$(dirname "$OUT")" "$(dirname "$PUBLISHED_OUT")"
rm -f "$OUT"

"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --no-first-run \
  --no-default-browser-check \
  --disable-background-networking \
  --no-pdf-header-footer \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=5000 \
  --user-data-dir="$PROFILE" \
  --print-to-pdf="$OUT" \
  "$URL" >/dev/null 2>&1 &
CHROME_PID="$!"

STABLE_READS=0
LAST_SIZE=0
for _ in {1..120}; do
  if [[ -s "$OUT" ]] && pdfinfo "$OUT" >/dev/null 2>&1; then
    CURRENT_SIZE="$(stat -f '%z' "$OUT")"
    if [[ "$CURRENT_SIZE" -eq "$LAST_SIZE" ]]; then
      STABLE_READS=$((STABLE_READS + 1))
    else
      STABLE_READS=0
      LAST_SIZE="$CURRENT_SIZE"
    fi
    [[ "$STABLE_READS" -ge 3 ]] && break
  fi
  sleep 0.25
done

kill "$CHROME_PID" >/dev/null 2>&1 || true
wait "$CHROME_PID" >/dev/null 2>&1 || true
CHROME_PID=""

if [[ "$STABLE_READS" -lt 3 || ! -s "$OUT" ]]; then
  echo "Chrome did not produce $OUT" >&2
  exit 1
fi

FONT_REPORT="$(pdffonts "$OUT")"
grep -q 'UMSans-Variable' <<<"$FONT_REPORT"
grep -q 'UMSans-VariableItalic' <<<"$FONT_REPORT"

if grep -Eq 'Poppins|OpenSans|Arial' <<<"$FONT_REPORT"; then
  echo "Unexpected fallback font embedded in PDF" >&2
  echo "$FONT_REPORT" >&2
  exit 1
fi

PAGES="$(pdfinfo "$OUT" | awk '/^Pages:/ { print $2 }')"
if [[ -z "$PAGES" || "$PAGES" -lt 10 ]]; then
  echo "Incomplete specimen PDF: ${PAGES:-0} pages" >&2
  exit 1
fi

if [[ "$OUT" != "$PUBLISHED_OUT" ]]; then
  cp "$OUT" "$PUBLISHED_OUT"
fi

echo "UM Sans PDF gate: PASS"
echo "File: $OUT"
echo "Release proof: $PUBLISHED_OUT"
echo "Pages: $PAGES"
echo "$FONT_REPORT" | grep -E 'UMSans|Futura|Menlo'
