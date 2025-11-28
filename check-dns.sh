#!/bin/bash
echo "=== DNS PROPAGATION CHECK - \$(date) ==="
echo "Google DNS:" && nslookup www.umbot.com.ar 8.8.8.8 | grep "Address:" || echo "No resuelve"
echo "Cloudflare DNS:" && nslookup www.umbot.com.ar 1.1.1.1 | grep "Address:" || echo "No resuelve"
echo "Probando HTTPS:" && curl -I https://www.umbot.com.ar/ 2>/dev/null | head -1 || echo "Aún propagando"
