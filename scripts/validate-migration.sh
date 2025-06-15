#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Iniciando validación completa de la migración..."
echo "=============================================="

# Crear archivo de reporte
REPORT_FILE="migration_validation_report.txt"
echo "Reporte de Validación de Migración" > $REPORT_FILE
echo "Fecha: $(date)" >> $REPORT_FILE
echo "==============================================" >> $REPORT_FILE

# Función para ejecutar validación y guardar resultado
run_validation() {
    local script=$1
    local name=$2
    echo -e "\n${YELLOW}Ejecutando validación: $name${NC}"
    echo -e "\nValidación: $name" >> $REPORT_FILE
    echo "--------------------------------------------" >> $REPORT_FILE
    
    # Ejecutar script y capturar salida
    output=$($script 2>&1)
    status=$?
    
    # Guardar resultado en reporte
    echo "$output" >> $REPORT_FILE
    echo "--------------------------------------------" >> $REPORT_FILE
    
    # Mostrar resultado
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✅ $name completado exitosamente${NC}"
    else
        echo -e "${RED}❌ $name falló${NC}"
    fi
    
    return $status
}

# Ejecutar validaciones en secuencia
run_validation "./scripts/validate-database.sh" "Validación de Base de Datos"
DB_STATUS=$?

run_validation "./scripts/validate-images.sh" "Validación de Imágenes"
IMAGES_STATUS=$?

run_validation "./scripts/test-connectivity.sh" "Validación de Conectividad"
CONN_STATUS=$?

# Resumen final
echo -e "\n${YELLOW}Resumen de Validación:${NC}"
echo "=============================================="
echo -e "Base de Datos: ${DB_STATUS:-1} - ${DB_STATUS:-1} == 0 ? ${GREEN}✅${NC} : ${RED}❌${NC}"
echo -e "Imágenes: ${IMAGES_STATUS:-1} - ${IMAGES_STATUS:-1} == 0 ? ${GREEN}✅${NC} : ${RED}❌${NC}"
echo -e "Conectividad: ${CONN_STATUS:-1} - ${CONN_STATUS:-1} == 0 ? ${GREEN}✅${NC} : ${RED}❌${NC}"

# Guardar resumen en reporte
echo -e "\nResumen de Validación:" >> $REPORT_FILE
echo "==============================================" >> $REPORT_FILE
echo "Base de Datos: $([ $DB_STATUS -eq 0 ] && echo "✅" || echo "❌")" >> $REPORT_FILE
echo "Imágenes: $([ $IMAGES_STATUS -eq 0 ] && echo "✅" || echo "❌")" >> $REPORT_FILE
echo "Conectividad: $([ $CONN_STATUS -eq 0 ] && echo "✅" || echo "❌")" >> $REPORT_FILE

echo -e "\n${GREEN}Validación completada. Reporte guardado en $REPORT_FILE${NC}" 