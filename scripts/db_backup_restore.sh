#!/bin/bash

# Script para realizar backup y restauración de la base de datos
# Uso: ./db_backup_restore.sh [backup|restore] [dev|prod] [archivo_backup]

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar argumentos
if [ "$#" -lt 2 ]; then
    echo -e "${RED}Error: Argumentos insuficientes${NC}"
    echo -e "Uso: ./db_backup_restore.sh [backup|restore] [dev|prod] [archivo_backup]"
    exit 1
fi

ACTION=$1
ENV=$2
BACKUP_FILE=$3
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"

# Validar acción
if [ "$ACTION" != "backup" ] && [ "$ACTION" != "restore" ]; then
    echo -e "${RED}Error: Acción no válida. Use 'backup' o 'restore'${NC}"
    exit 1
fi

# Validar entorno
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo -e "${RED}Error: Entorno no válido. Use 'dev' o 'prod'${NC}"
    exit 1
fi

# Configurar variables según el entorno
if [ "$ENV" == "dev" ]; then
    ENV_FILE=".env.development"
    COMPOSE_FILE="docker-compose.development.yml"
    CONTAINER_NAME="database-dev"
else
    ENV_FILE=".env.production"
    COMPOSE_FILE="docker-compose.production.yml"
    CONTAINER_NAME="database"
fi

# Verificar que los archivos necesarios existan
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: Archivo $ENV_FILE no encontrado${NC}"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}Error: Archivo $COMPOSE_FILE no encontrado${NC}"
    exit 1
fi

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Extraer variables de la base de datos del archivo .env
DB_USER=$(grep "DB_USER" $ENV_FILE | cut -d'=' -f2 | tr -d '"' | tr -d "'" | sed 's/^[ \t]*//;s/[ \t]*$//')
DB_PASSWORD=$(grep "DB_PASSWORD" $ENV_FILE | cut -d'=' -f2 | tr -d '"' | tr -d "'" | sed 's/^[ \t]*//;s/[ \t]*$//')
DB_DATABASE=$(grep "DB_DATABASE" $ENV_FILE | cut -d'=' -f2 | tr -d '"' | tr -d "'" | sed 's/^[ \t]*//;s/[ \t]*$//')

# Verificar si el contenedor está en ejecución
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}Error: El contenedor $CONTAINER_NAME no está en ejecución.${NC}"
    echo -e "Inicie los contenedores con: docker-compose -f $COMPOSE_FILE up -d"
    exit 1
fi

# Realizar acción según lo solicitado
if [ "$ACTION" == "backup" ]; then
    # Si no se especificó un nombre de archivo, usar uno con timestamp
    if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE="${BACKUP_DIR}/backup_${ENV}_${TIMESTAMP}.sql"
    else
        # Si se proporcionó un nombre pero no incluye la ruta, añadir el directorio de backups
        if [[ "$BACKUP_FILE" != *"/"* ]]; then
            BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
        fi
    fi
    
    echo -e "${YELLOW}Realizando backup de la base de datos ${DB_DATABASE} en ${ENV}...${NC}"
    docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_DATABASE > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}¡Backup completado exitosamente!${NC}"
        echo -e "Archivo de backup: ${BACKUP_FILE}"
        # Crear un archivo de verificación con información sobre el backup
        echo "Backup realizado: $(date)" > "${BACKUP_FILE}.info"
        echo "Entorno: $ENV" >> "${BACKUP_FILE}.info"
        echo "Base de datos: $DB_DATABASE" >> "${BACKUP_FILE}.info"
        echo "Tamaño: $(du -h $BACKUP_FILE | cut -f1)" >> "${BACKUP_FILE}.info"
    else
        echo -e "${RED}Error al realizar el backup.${NC}"
        exit 1
    fi
else
    # Restauración de backup
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Debe especificar un archivo de backup para restaurar${NC}"
        exit 1
    fi
    
    # Si se proporcionó un nombre pero no incluye la ruta, añadir el directorio de backups
    if [[ "$BACKUP_FILE" != *"/"* ]]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    fi
    
    # Verificar que el archivo de backup existe
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Archivo de backup $BACKUP_FILE no encontrado${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Restaurando backup en la base de datos ${DB_DATABASE} en ${ENV}...${NC}"
    echo -e "${RED}ADVERTENCIA: Esta operación sobrescribirá todos los datos existentes.${NC}"
    read -p "¿Está seguro de que desea continuar? (s/n): " CONFIRM
    
    if [ "$CONFIRM" != "s" ]; then
        echo -e "${YELLOW}Operación cancelada por el usuario.${NC}"
        exit 0
    fi
    
    # Crear un backup antes de restaurar por seguridad
    SAFETY_BACKUP="${BACKUP_DIR}/pre_restore_${ENV}_${TIMESTAMP}.sql"
    echo -e "${YELLOW}Creando backup de seguridad antes de restaurar...${NC}"
    docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_DATABASE > $SAFETY_BACKUP
    
    # Restaurar el backup
    cat $BACKUP_FILE | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_DATABASE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}¡Restauración completada exitosamente!${NC}"
        echo -e "Se ha creado un backup de seguridad en: ${SAFETY_BACKUP}"
    else
        echo -e "${RED}Error al restaurar el backup.${NC}"
        echo -e "${YELLOW}Se ha creado un backup de seguridad en: ${SAFETY_BACKUP}${NC}"
        exit 1
    fi
fi

exit 0
