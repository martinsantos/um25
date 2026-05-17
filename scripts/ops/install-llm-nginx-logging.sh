#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-/root/fumbling-field}"
NGINX_SOURCE="$REPO_DIR/ops/nginx/00-ultimamilla-llm-analytics.conf"
LOGROTATE_SOURCE="$REPO_DIR/ops/logrotate.d/ultimamilla-llm-access"
NGINX_DEST="/etc/nginx/conf.d/00-ultimamilla-llm-analytics.conf"
LOGROTATE_DEST="/etc/logrotate.d/ultimamilla-llm-access"
BACKUP_DIR="/root/nginx-llm-analytics-backups/$(date +%Y%m%d-%H%M%S)"

if [ ! -f "$NGINX_SOURCE" ]; then
  echo "Missing Nginx source snippet: $NGINX_SOURCE" >&2
  exit 1
fi

if [ ! -f "$LOGROTATE_SOURCE" ]; then
  echo "Missing logrotate source: $LOGROTATE_SOURCE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

if [ -f "$NGINX_DEST" ]; then
  cp -a "$NGINX_DEST" "$BACKUP_DIR/00-ultimamilla-llm-analytics.conf"
fi

if [ -f "$LOGROTATE_DEST" ]; then
  cp -a "$LOGROTATE_DEST" "$BACKUP_DIR/ultimamilla-llm-access"
fi

restore_previous_files() {
  if [ -f "$BACKUP_DIR/00-ultimamilla-llm-analytics.conf" ]; then
    cp -a "$BACKUP_DIR/00-ultimamilla-llm-analytics.conf" "$NGINX_DEST"
  else
    rm -f "$NGINX_DEST"
  fi

  if [ -f "$BACKUP_DIR/ultimamilla-llm-access" ]; then
    cp -a "$BACKUP_DIR/ultimamilla-llm-access" "$LOGROTATE_DEST"
  else
    rm -f "$LOGROTATE_DEST"
  fi
}

install -m 0644 "$NGINX_SOURCE" "$NGINX_DEST"
install -m 0644 "$LOGROTATE_SOURCE" "$LOGROTATE_DEST"
touch /var/log/nginx/ultimamilla-llm-access.log
chown nginx:root /var/log/nginx/ultimamilla-llm-access.log 2>/dev/null || true
chmod 0640 /var/log/nginx/ultimamilla-llm-access.log

if nginx -t; then
  systemctl reload nginx
  echo "LLM Nginx analytics installed."
  echo "Report with: $REPO_DIR/scripts/ops/report-llm-access.sh"
else
  echo "nginx -t failed; restoring previous files." >&2
  restore_previous_files
  nginx -t || true
  exit 1
fi
