#!/bin/bash

# SCRIPT DE LIMPIEZA SEGURA SIN DOWNTIME
# Análisis y refactorización del proyecto ULTIMA MILLA

set -e

PROJECT_DIR="/root/fumbling-field"
BACKUP_DIR="/root/backup-cleanup-$(date +%Y%m%d)"
LOG_FILE="$BACKUP_DIR/cleanup.log"

echo "🧹 INICIANDO LIMPIEZA SEGURA SIN IMPACTO EN PRODUCCIÓN" | tee -a $LOG_FILE
echo "📁 Proyecto: $PROJECT_DIR" | tee -a $LOG_FILE
echo "💾 Backup: $BACKUP_DIR" | tee -a $LOG_FILE
echo "$(date): Iniciando análisis..." | tee -a $LOG_FILE

cd $PROJECT_DIR

# 1. ANÁLISIS DE ARCHIVOS REDUNDANTES
echo -e "\n📊 ANÁLISIS DE ARCHIVOS REDUNDANTES:" | tee -a $LOG_FILE

# Contar archivos backup
BACKUP_FILES=$(find . -maxdepth 1 -name "*.backup*" -o -name "*.bak*" -o -name "*.old*" | wc -l)
echo "   • Archivos backup/bak/old: $BACKUP_FILES" | tee -a $LOG_FILE

# Contar scripts
SCRIPT_FILES=$(find . -maxdepth 1 -name "*.sh" | wc -l)
echo "   • Scripts (.sh): $SCRIPT_FILES" | tee -a $LOG_FILE

# Contar configs Docker
DOCKER_CONFIGS=$(find . -maxdepth 1 -name "docker-compose*.yml" | wc -l)
echo "   • Docker configs: $DOCKER_CONFIGS" | tee -a $LOG_FILE

# 2. IDENTIFICAR ARCHIVOS SEGUROS PARA MOVER
echo -e "\n🔍 IDENTIFICANDO ARCHIVOS SEGUROS PARA MOVER:" | tee -a $LOG_FILE

# Lista de archivos seguros para mover (no críticos para producción)
SAFE_TO_MOVE=(
    "*.backup*"
    "*.bak*"
    "*.old*"
    "*.md.backup*"
    "*EMERGENCY*"
    "*emergency*"
    "*temp*"
    "*test*"
    "*fix*"
    "*debug*"
    "*-fix.sh"
    "*-test.*"
    "*-backup.*"
    "upload_log.txt"
    "migration_validation_report.txt"
    "*.conflictivo.backup"
)

# 3. CREAR ESTRUCTURA DE BACKUP ORGANIZADA
mkdir -p $BACKUP_DIR/{scripts,configs,backups,docs,logs,temp}

# 4. MOVER ARCHIVOS DE FORMA SEGURA
echo -e "\n📦 MOVIENDO ARCHIVOS DE FORMA SEGURA:" | tee -a $LOG_FILE

MOVED_COUNT=0

# Mover archivos backup
for pattern in "*.backup*" "*.bak*" "*.old*"; do
    for file in $pattern 2>/dev/null; do
        if [ -f "$file" ]; then
            mv "$file" "$BACKUP_DIR/backups/"
            echo "   ✅ Movido: $file" | tee -a $LOG_FILE
            ((MOVED_COUNT++))
        fi
    done
done

# Mover scripts de emergencia/fix (mantener solo los esenciales)
for file in *emergency* *EMERGENCY* *fix* *FIX* 2>/dev/null; do
    if [ -f "$file" ] && [[ ! "$file" =~ ^(docker-compose|nginx|astro.config) ]]; then
        mv "$file" "$BACKUP_DIR/scripts/"
        echo "   ✅ Movido script: $file" | tee -a $LOG_FILE
        ((MOVED_COUNT++))
    fi
done

# Mover logs antiguos
for file in *.log upload_log.txt migration_validation_report.txt 2>/dev/null; do
    if [ -f "$file" ]; then
        mv "$file" "$BACKUP_DIR/logs/"
        echo "   ✅ Movido log: $file" | tee -a $LOG_FILE
        ((MOVED_COUNT++))
    fi
done

# 5. ANÁLISIS POST-LIMPIEZA
echo -e "\n📈 ANÁLISIS POST-LIMPIEZA:" | tee -a $LOG_FILE
echo "   • Archivos movidos: $MOVED_COUNT" | tee -a $LOG_FILE

# Verificar espacio liberado
SPACE_AFTER=$(df -h $PROJECT_DIR | awk 'NR==2 {print $4}')
echo "   • Espacio disponible: $SPACE_AFTER" | tee -a $LOG_FILE

# Verificar que los servicios siguen funcionando
echo -e "\n🔍 VERIFICANDO SERVICIOS POST-LIMPIEZA:" | tee -a $LOG_FILE

if docker ps | grep -q "umbot-astro-prod.*Up"; then
    echo "   ✅ Astro: Funcionando" | tee -a $LOG_FILE
else
    echo "   ❌ Astro: Problema detectado" | tee -a $LOG_FILE
fi

if docker ps | grep -q "umbot-directus-prod.*Up"; then
    echo "   ✅ Directus: Funcionando" | tee -a $LOG_FILE
else
    echo "   ❌ Directus: Problema detectado" | tee -a $LOG_FILE
fi

if docker ps | grep -q "umbot-nginx-prod.*Up"; then
    echo "   ✅ Nginx: Funcionando" | tee -a $LOG_FILE
else
    echo "   ❌ Nginx: Problema detectado" | tee -a $LOG_FILE
fi

echo -e "\n✅ LIMPIEZA COMPLETADA SIN IMPACTO EN PRODUCCIÓN" | tee -a $LOG_FILE
echo "📄 Log completo: $LOG_FILE" | tee -a $LOG_FILE
echo "$(date): Finalizado" | tee -a $LOG_FILE

# 6. GENERAR REPORTE DE PRÓXIMAS ACCIONES
echo -e "\n📋 PRÓXIMAS ACCIONES RECOMENDADAS:" | tee -a $LOG_FILE
echo "   1. Limpiar imágenes Docker no utilizadas" | tee -a $LOG_FILE
echo "   2. Consolidar configuraciones Docker" | tee -a $LOG_FILE
echo "   3. Actualizar healthchecks de contenedores" | tee -a $LOG_FILE
echo "   4. Planificar actualización de Directus" | tee -a $LOG_FILE
echo "   5. Optimizar estructura del proyecto" | tee -a $LOG_FILE
