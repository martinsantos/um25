#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting UMBot Directus Migration ===${NC}"

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# 1. Connect to server and backup current database
echo -e "\n${YELLOW}1. Creating database backup...${NC}"
ssh root@23.105.176.45 "docker exec fumbling-field-database-1 pg_dump -U myuser mydatabase > /root/backup_$(date +%Y%m%d_%H%M%S).sql"
check_status "Database backup"

# 2. Copy migration files to server
echo -e "\n${YELLOW}2. Copying migration files to server...${NC}"
scp setup-tables.sql migrate_data.py root@23.105.176.45:/root/
check_status "File copy"

# 3. Set up tables and permissions
echo -e "\n${YELLOW}3. Setting up database structure...${NC}"
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase" < setup-tables.sql
check_status "Database setup"

# 4. Install Python dependencies on server
echo -e "\n${YELLOW}4. Installing Python dependencies...${NC}"
ssh root@23.105.176.45 "apt-get update && apt-get install -y python3-pip && pip3 install requests urllib3"
check_status "Python setup"

# 5. Copy data files to server
echo -e "\n${YELLOW}5. Copying data files...${NC}"
ssh root@23.105.176.45 "mkdir -p /root/src/data"
scp src/data/antecedentes_completos.js src/data/servicios_completos.js root@23.105.176.45:/root/src/data/
check_status "Data files copy"

# 6. Copy images directory
echo -e "\n${YELLOW}6. Copying images...${NC}"
scp -r imagenes_antecedentes_versionproduccion root@23.105.176.45:/root/
check_status "Images copy"

# 7. Run migration script
echo -e "\n${YELLOW}7. Running data migration...${NC}"
ssh root@23.105.176.45 "cd /root && python3 migrate_data.py"
check_status "Data migration"

# 8. Verify migration
echo -e "\n${YELLOW}8. Verifying migration...${NC}"
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase -c 'SELECT COUNT(*) FROM antecedentes;' -c 'SELECT COUNT(*) FROM servicios;'"
check_status "Migration verification"

echo -e "\n${GREEN}=== Migration completed successfully ===${NC}"
echo "Please verify the data in the Directus admin panel at https://www.umbot.com.ar/admin" 