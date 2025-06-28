#!/bin/bash
required_vars=(
    "DB_CLIENT"
    "DB_HOST"
    "DB_PORT"
    "DB_DATABASE"
    "DB_USER"
    "DB_PASSWORD"
    "KEY"
    "SECRET"
    "ADMIN_EMAIL"
    "ADMIN_PASSWORD"
    "PUBLIC_URL"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Variables faltantes:"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
else
    echo "✅ Todas las variables críticas están presentes"
fi
