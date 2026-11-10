#!/bin/bash

# Crear un archivo .env con la configuración correcta
ssh root@23.105.176.45 "cd /root/um25 && cat > .env << EOL
# Directus Configuration
PUBLIC_DIRECTUS_URL=http://23.105.176.45:8055
DIRECTUS_URL=http://directus-app:8055
DIRECTUS_STATIC_TOKEN=eqGR2YD4QrMIsftG6V2FR5MuNu0Ope6-
DIRECTUS_KEY=REPLACE_WITH_DIRECTUS_KEY
DIRECTUS_SECRET=REPLACE_WITH_DIRECTUS_SECRET

# Database Configuration
DB_USER=myuser
DB_PASSWORD=REPLACE_WITH_POSTGRES_PASSWORD
DB_DATABASE=mydatabase

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=REPLACE_WITH_DIRECTUS_ADMIN_PASSWORD

# URL Configuration
PUBLIC_URL=http://23.105.176.45:8055
CORS_ENABLED=true
CORS_ORIGIN=http://23.105.176.45,http://23.105.176.45:8080
PUBLIC_ASSETS=true
EOL"

# Reiniciar los contenedores
ssh root@23.105.176.45 "cd /root/um25 && docker-compose -f docker-compose.server.yml down && docker-compose -f docker-compose.server.yml up -d"

echo "Configuración de Astro actualizada y contenedores reiniciados"
