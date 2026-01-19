#!/bin/bash
# verify-urls.sh
# Checks specific deep-link URLs to ensure they return 200 OK

failed=0

check_url() {
    url=$1
    echo -n "Checking $url ... "
    status=$(curl -o /dev/null -s -w "%{http_code}\n" "$url")
    if [ "$status" == "200" ]; then
        echo "✅ OK ($status)"
    else
        echo "❌ FAILED ($status)"
        failed=1
    fi
}

echo "=== Verifying Critical SEO URLs ==="
check_url "https://ultimamilla.com.ar/antecedentes/10768"
check_url "https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones"
check_url "https://ultimamilla.com.ar/servicios/ciberseguridad"
check_url "https://ultimamilla.com.ar/bodegas"

exit $failed
