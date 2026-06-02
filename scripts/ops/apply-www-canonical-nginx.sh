#!/usr/bin/env bash
set -euo pipefail

cat >&2 <<'MSG'
Deprecated operation blocked.

Production currently uses https://ultimamilla.com.ar as canonical and redirects
the www host to the apex host. This script implemented the old inverse policy
and must not be used for current production deploys.
MSG
exit 64
