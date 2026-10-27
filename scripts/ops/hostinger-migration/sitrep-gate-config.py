#!/usr/bin/env python3
"""Render reviewed SITREP migration gates; this file changes no server state."""

HOST = 'sitrep.ultimamilla.com.ar'
TARGET_IP = '179.198.115.115'
CERT = '/etc/letsencrypt/live/sitrep.ultimamilla.com.ar/fullchain.pem'
KEY = '/etc/letsencrypt/live/sitrep.ultimamilla.com.ar/privkey.pem'


def render_gate(mode):
    if mode not in ('maintenance', 'proxy'):
        raise ValueError('Unknown SITREP gate mode')
    mapping = ''
    if mode == 'maintenance':
        body = '''    default_type text/plain;
    add_header Retry-After 120 always;
    return 503 "SITREP esta en mantenimiento. Reintente en unos minutos.\\n";'''
    else:
        mapping = '''map $http_upgrade $umsa_sitrep_upgrade {
    default upgrade;
    '' close;
}
'''
        body = f'''    location / {{
        proxy_pass https://{TARGET_IP};
        proxy_ssl_server_name on;
        proxy_ssl_name {HOST};
        proxy_ssl_verify on;
        proxy_ssl_trusted_certificate /etc/pki/tls/certs/ca-bundle.crt;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header CF-Connecting-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $umsa_sitrep_upgrade;
        proxy_http_version 1.1;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 86400s;
        client_max_body_size 100M;
    }}'''
    return mapping + f'''server {{
    listen 80;
    server_name {HOST} www.{HOST};
    return 301 https://{HOST}$request_uri;
}}
server {{
    listen 443 ssl http2;
    server_name {HOST} www.{HOST};
    ssl_certificate {CERT};
    ssl_certificate_key {KEY};
    ssl_protocols TLSv1.2 TLSv1.3;
{body}
}}
'''
