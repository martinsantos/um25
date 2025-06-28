#!/bin/bash

# Configuración de la base de datos
export POSTGRES_DB="mydatabase"
export POSTGRES_USER="myuser"
export POSTGRES_PASSWORD="mypassword"
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install psycopg2-binary

# Ejecutar script de migración
python3 migrate-service-images.py

# Desactivar entorno virtual
deactivate 