#!/bin/bash

# Detener y eliminar contenedores existentes
echo "Deteniendo y eliminando contenedores existentes..."
docker-compose down -v

# Eliminar volúmenes antiguos (si existen)
echo "Eliminando volúmenes antiguos..."
docker volume rm -f fumbling-field_directus_db_data fumbling-field_directus_uploads fumbling-field_directus_extensions fumbling-field_astro_node_modules 2>/dev/null || true

# Iniciar solo la base de datos
echo "Iniciando la base de datos..."
docker-compose up -d database

# Esperar a que PostgreSQL esté listo
echo "Esperando a que PostgreSQL esté listo..."
until docker exec database pg_isready -U postgres; do
  sleep 2
done

# Crear la base de datos (por si acaso)
echo "Creando base de datos directus..."
docker exec -i database psql -U postgres -c "CREATE DATABASE directus;" 2>/dev/null || true

# Copiar el archivo de respaldo al contenedor
echo "Copiando archivo de respaldo al contenedor..."
docker cp ./backup.sql database:/backup.sql

# Restaurar la base de datos
echo "Restaurando la base de datos..."
docker exec -i database psql -U postgres -d directus -f /backup.sql

# Iniciar todos los servicios
echo "Iniciando todos los servicios..."
docker-compose up -d

echo "¡Restauración completada!"
echo "Puedes acceder a Directus en: http://localhost:8055"
echo "Usuario: admin@example.com"
echo "Contraseña: adminpassword"
