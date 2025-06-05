#!/bin/bash

# Este script implementa la solución documentada en SOLUCION_AUTENTICACION.md
# Utiliza el mismo token estático que funciona en el entorno local

echo "Aplicando la solución al problema de autenticación en Directus..."

# Token estático que funciona en el entorno local
LOCAL_TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"

echo "1. Actualizando el archivo .env en el servidor con el token correcto..."
ssh root@23.105.176.45 "cd /root/um25 && cat > .env << EOL
# Directus Configuration
PUBLIC_DIRECTUS_URL=http://23.105.176.45:8055
DIRECTUS_URL=http://directus-app:8055
DIRECTUS_STATIC_TOKEN=\"${LOCAL_TOKEN}\"
DIRECTUS_KEY=\"pzdIoGXgfJODqy8lLFxwi2NOK/K7j7Qii7W26rHS9Tk=\"
DIRECTUS_SECRET=\"d/QUPftXXNdfnAmN5SSmWPrYLzHqWF9rixk6XrwchR4=\"

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
ASSETS_TRANSFORM_TOKEN_OPTIONAL=true
ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION=10000
FILE_IMPORT_MAX_SIZE=100000000
STORAGE_UPLOAD_MAX_SIZE=100000000
EOL"

echo "2. Actualizando el archivo .env.js en el directorio dist..."
ssh root@23.105.176.45 "cd /root/um25 && cat > dist/.env.js << EOL
export default {
  PUBLIC_DIRECTUS_URL: 'http://23.105.176.45:8055',
  DIRECTUS_URL: 'http://directus-app:8055',
  DIRECTUS_STATIC_TOKEN: '${LOCAL_TOKEN}'
};
EOL"

echo "3. Creando un script SQL para actualizar el token en la base de datos..."
ssh root@23.105.176.45 "cd /root/um25 && cat > update_token.sql << EOL
-- Actualizar el token estático en la tabla directus_users para el usuario admin
UPDATE directus_users 
SET token = '${LOCAL_TOKEN}' 
WHERE email = 'admin@example.com';
EOL"

echo "4. Ejecutando el script SQL para actualizar el token en la base de datos..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i database psql -U myuser -d mydatabase < update_token.sql"

echo "5. Actualizando la configuración de Docker Compose..."
ssh root@23.105.176.45 "cd /root/um25 && cat > docker-compose.server.yml << EOL
services:
  astro-app:
    image: node:18-alpine
    container_name: astro-app
    restart: always
    working_dir: /app
    ports:
      - \"8080:4321\"
    volumes:
      - ./dist:/app/dist
      - ./node_modules:/app/node_modules
      - ./package.json:/app/package.json
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - DIRECTUS_URL=http://directus-app:8055
      - PUBLIC_DIRECTUS_URL=http://23.105.176.45:8055
      - DIRECTUS_STATIC_TOKEN=${LOCAL_TOKEN}
    command: node ./dist/server/entry.mjs
    depends_on:
      - directus-app
    networks:
      - um25_network
    healthcheck:
      test: [\"CMD\", \"wget\", \"--spider\", \"-q\", \"http://0.0.0.0:4321\"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
    logging:
      driver: \"json-file\"
      options:
        max-size: \"10m\"
        max-file: \"3\"

  database:
    image: postgres:15-alpine
    container_name: database
    restart: always
    environment:
      POSTGRES_USER: \${DB_USER:-myuser}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-mypassword}
      POSTGRES_DB: \${DB_DATABASE:-mydatabase}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - um25_network
    healthcheck:
      test: [\"CMD-SHELL\", \"pg_isready -U \${DB_USER:-myuser} -d \${DB_DATABASE:-mydatabase}\"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 1G
    logging:
      driver: \"json-file\"
      options:
        max-size: \"10m\"
        max-file: \"3\"

  directus-app:
    image: directus/directus:11.7.2
    container_name: directus-app
    restart: always
    ports:
      - \"8055:8055\"
    depends_on:
      - database
    environment:
      KEY: \${DIRECTUS_KEY:-pzdIoGXgfJODqy8lLFxwi2NOK/K7j7Qii7W26rHS9Tk=}
      SECRET: \${DIRECTUS_SECRET:-d/QUPftXXNdfnAmN5SSmWPrYLzHqWF9rixk6XrwchR4=}
      DB_CLIENT: pg
      DB_HOST: database
      DB_PORT: 5432
      DB_USER: \${DB_USER:-myuser}
      DB_PASSWORD: \${DB_PASSWORD:-mypassword}
      DB_DATABASE: \${DB_DATABASE:-mydatabase}
      ADMIN_EMAIL: \${ADMIN_EMAIL:-admin@example.com}
      ADMIN_PASSWORD: \${ADMIN_PASSWORD:-adminpassword}
      PUBLIC_URL: \${PUBLIC_URL:-http://23.105.176.45:8055}
      CORS_ENABLED: \${CORS_ENABLED:-true}
      CORS_ORIGIN: \${CORS_ORIGIN:-http://23.105.176.45,http://23.105.176.45:8080}
      PUBLIC_ASSETS: \${PUBLIC_ASSETS:-true}
      ASSETS_CACHE_TTL: \"0\"
      ASSETS_TRANSFORM_TOKEN_OPTIONAL: \"true\"
      ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION: \"10000\"
      FILE_IMPORT_MAX_SIZE: \"100000000\"
      STORAGE_UPLOAD_MAX_SIZE: \"100000000\"
    volumes:
      - directus_uploads:/directus/uploads
      - directus_extensions:/directus/extensions
    networks:
      - um25_network
    healthcheck:
      test: [\"CMD\", \"wget\", \"--spider\", \"-q\", \"--header=Accept: text/html\", \"http://0.0.0.0:8055\"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
    logging:
      driver: \"json-file\"
      options:
        max-size: \"10m\"
        max-file: \"3\"

volumes:
  postgres_data:
    name: um25_postgres_data
  directus_uploads:
    name: um25_directus_uploads
  directus_extensions:
    name: um25_directus_extensions

networks:
  um25_network:
    name: um25_network
EOL"

echo "6. Creando un script SQL para actualizar los permisos en la base de datos..."
ssh root@23.105.176.45 "cd /root/um25 && cat > update_permissions.sql << EOL
-- Obtener el ID del rol público
DO \$\$
DECLARE
    public_role_id uuid;
BEGIN
    -- Intentar obtener el ID del rol público
    SELECT id INTO public_role_id FROM directus_roles WHERE name = 'Public';
    
    -- Si no existe, usar el ID proporcionado
    IF public_role_id IS NULL THEN
        public_role_id := '74e3b05e-0f14-422e-9ad3-759d426db60a'::uuid;
    END IF;
    
    -- Insertar permisos para directus_files
    INSERT INTO directus_permissions (id, collection, action, permissions, validation, presets, fields, policy)
    SELECT 
        nextval('directus_permissions_id_seq'), 
        'directus_files', 
        'read', 
        '{}', 
        '{}', 
        NULL, 
        '*',
        (SELECT id FROM directus_policies LIMIT 1)
    WHERE NOT EXISTS (
        SELECT 1 FROM directus_permissions 
        WHERE collection = 'directus_files' AND action = 'read'
    );
    
    -- Insertar permisos para Antecedentes
    INSERT INTO directus_permissions (id, collection, action, permissions, validation, presets, fields, policy)
    SELECT 
        nextval('directus_permissions_id_seq'), 
        'Antecedentes', 
        'read', 
        '{}', 
        '{}', 
        NULL, 
        '*',
        (SELECT id FROM directus_policies LIMIT 1)
    WHERE NOT EXISTS (
        SELECT 1 FROM directus_permissions 
        WHERE collection = 'Antecedentes' AND action = 'read'
    );
    
    -- Insertar permisos para Antecedentes_files
    INSERT INTO directus_permissions (id, collection, action, permissions, validation, presets, fields, policy)
    SELECT 
        nextval('directus_permissions_id_seq'), 
        'Antecedentes_files', 
        'read', 
        '{}', 
        '{}', 
        NULL, 
        '*',
        (SELECT id FROM directus_policies LIMIT 1)
    WHERE NOT EXISTS (
        SELECT 1 FROM directus_permissions 
        WHERE collection = 'Antecedentes_files' AND action = 'read'
    );
END \$\$;
EOL"

echo "7. Ejecutando el script SQL para actualizar los permisos..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i database psql -U myuser -d mydatabase < update_permissions.sql"

echo "8. Reiniciando los contenedores..."
ssh root@23.105.176.45 "cd /root/um25 && docker-compose -f docker-compose.server.yml down && docker-compose -f docker-compose.server.yml up -d"

echo "9. Verificando el estado de los contenedores..."
ssh root@23.105.176.45 "cd /root/um25 && docker ps"

echo "Operación completada. Espere unos minutos y luego verifique http://23.105.176.45:8080/antecedentes"
echo "Si persiste el problema, verifique los logs con: docker logs astro-app"
