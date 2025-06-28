#!/bin/bash

echo "🔧 Corrigiendo la colección Antecedentes..."

# Conectar a la base de datos y agregar la columna id como clave primaria
docker-compose exec -T database psql -U myuser -d mydatabase << EOF
ALTER TABLE "Antecedentes" ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
EOF

echo "✨ Colección Antecedentes corregida" 