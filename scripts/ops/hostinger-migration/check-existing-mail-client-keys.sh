#!/usr/bin/env bash
# Inspect only key fingerprints; do not print key contents or contact a server.
set -euo pipefail
umask 077
test -n "${RUNNER_TEMP:-}"
expected='SHA256:cprunwyf65XzfqsCERkpWr7CEEb3iwjji1CyWvuYR8U'
keyfile="$RUNNER_TEMP/umsa-reviewed-key-check"
test ! -e "$keyfile"
install -m 0600 /dev/null "$keyfile"
inspect() {
  local name=$1 value=$2 encoding=$3 fingerprint
  if [[ "$encoding" == base64 ]]; then
    if ! printf '%s' "$value" | base64 --decode > "$keyfile" 2>/dev/null; then
      printf '%s: not a matching key\n' "$name"
      return
    fi
  else
    printf '%s\n' "$value" > "$keyfile"
  fi
  fingerprint=$(ssh-keygen -lf "$keyfile" 2>/dev/null | awk '{print $2}') || fingerprint=''
  if [[ "$fingerprint" == "$expected" ]]; then
    printf '%s: matches the known Vivero client key\n' "$name"
  else
    printf '%s: not a matching key\n' "$name"
  fi
}
inspect 'VPS_SSH_KEY (raw)' "${CANDIDATE_RAW:-}" raw
inspect 'VPS_SSH_KEY (base64)' "${CANDIDATE_RAW:-}" base64
inspect 'VPS_SSH_KEY_BASE64 (raw)' "${CANDIDATE_BASE64:-}" raw
inspect 'VPS_SSH_KEY_BASE64 (base64)' "${CANDIDATE_BASE64:-}" base64
