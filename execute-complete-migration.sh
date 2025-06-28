#!/bin/bash
# SCRIPT DE EJECUCIÓN DE MIGRACIÓN COMPLETA
# Generado automáticamente el 2025-06-24T22:35:03.092Z

echo "🚀 INICIANDO MIGRACIÓN DE 469 ANTECEDENTES..."

# Verificar conectividad
echo "1️⃣ Verificando conectividad al servidor..."
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase -c 'SELECT version();'" || {
  echo "❌ Error de conectividad. Verificar SSH y contenedores."
  exit 1
}

# Ejecutar migración
echo "2️⃣ Ejecutando migración completa..."
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase" < migrate-469-antecedentes-complete.sql

# Verificar resultado
echo "3️⃣ Verificando migración..."
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase -c 'SELECT COUNT(*) as total FROM antecedentes;'"

echo "✅ MIGRACIÓN COMPLETA FINALIZADA"
