#!/usr/bin/env bash

set -euo pipefail

cat >&2 <<'EOF'
Manual production deployment is disabled for this repository.
Use the protected Git Flow and the GitHub Actions production workflow.
The public process is astro-ultimamilla; this script must not pull or restart
an untracked PM2 process.
EOF

exit 1
