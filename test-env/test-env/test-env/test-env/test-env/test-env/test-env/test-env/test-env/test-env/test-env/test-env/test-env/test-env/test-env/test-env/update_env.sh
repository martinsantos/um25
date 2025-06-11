#!/bin/bash

# Crear un nuevo archivo .env con un token estático
ssh root@23.105.176.45 "cd /root/um25 && cat > .env << EOL
# Directus Configuration
PUBLIC_DIRECTUS_URL=http://23.105.176.45:8055
DIRECTUS_URL=http://directus-app:8055
DIRECTUS_STATIC_TOKEN=STATIC-TOKEN-FOR-DIRECTUS-ACCESS
DIRECTUS_KEY=pzdIoGXgfJODqy8lLFxwi2NOK/K7j7Qii7W26rHS9Tk=
DIRECTUS_SECRET=d/QUPftXXNdfnAmN5SSmWPrYLzHqWF9rixk6XrwchR4=

# Database Configuration
DB_USER=myuser
DB_PASSWORD=mypassword
DB_DATABASE=mydatabase

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=adminpassword

# URL Configuration
PUBLIC_URL=http://23.105.176.45:8055
CORS_ENABLED=true
CORS_ORIGIN=http://23.105.176.45,http://23.105.176.45:8080
PUBLIC_ASSETS=true
EOL"

# Reiniciar los contenedores
ssh root@23.105.176.45 "cd /root/um25 && docker-compose -f docker-compose.server.yml down && docker-compose -f docker-compose.server.yml up -d"

echo "Configuración actualizada y contenedores reiniciados"
