#!/bin/bash
# ============================================================================
# DALILA - EXECUTE COMPLETE MIGRATION
# ============================================================================
# Description: Execute the complete upgrade migration safely
# File: 013_complete_development_upgrade.sql
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}DALILA - DATABASE MIGRATION${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

# Check if database container is running
if ! docker ps --format '{{.Names}}' | grep -q 'dalila-db'; then
    echo -e "${RED}❌ Database container 'dalila-db' is not running!${NC}"
    echo "Starting containers..."
    docker-compose up -d db
    sleep 5
fi

echo -e "${GREEN}✓ Database container is running${NC}"
echo ""

# Check if migration file exists
MIGRATION_FILE="database/013_complete_development_upgrade.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Migration file found${NC}"
echo -e "  File: ${YELLOW}$MIGRATION_FILE${NC}"
echo ""

# Backup database first
echo -e "${YELLOW}📦 Creating backup before migration...${NC}"
BACKUP_FILE="database/backup_before_013_$(date +%Y%m%d_%H%M%S).sql"
docker exec dalila-db mysqldump -u dalila_user -pdalila_password dalila_db > "$BACKUP_FILE" 2>/dev/null

if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    echo "Do you want to continue without backup? (yes/no)"
    read -r answer
    if [ "$answer" != "yes" ]; then
        echo "Migration cancelled."
        exit 1
    fi
fi
echo ""

# Show migration summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MIGRATION SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "This migration includes:"
echo -e "  ${GREEN}1.${NC} Property Categories Multiple (for developments)"
echo -e "  ${GREEN}2.${NC} Price Base Currency (USD/MXN toggle)"
echo -e "  ${GREEN}3.${NC} Bedrooms/Bathrooms Range (for developments)"
echo -e "  ${GREEN}4.${NC} Bidirectional price conversion triggers"
echo -e "  ${GREEN}5.${NC} Auto-calculation sqft from sqm"
echo ""

echo -e "${YELLOW}⚠️  This will modify the database structure!${NC}"
echo -e "Do you want to proceed? (yes/no)"
read -r answer

if [ "$answer" != "yes" ]; then
    echo -e "${RED}Migration cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🚀 Executing migration...${NC}"
echo ""

# Execute migration
if docker exec -i dalila-db mysql -u dalila_user -pdalila_password dalila_db < "$MIGRATION_FILE"; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ MIGRATION COMPLETED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # Show new columns
    echo -e "${BLUE}New columns added:${NC}"
    docker exec dalila-db mysql -u dalila_user -pdalila_password dalila_db -e "
        SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'dalila_db' 
          AND TABLE_NAME = 'properties' 
          AND (COLUMN_NAME LIKE '%price%' 
            OR COLUMN_NAME LIKE '%bedroom%' 
            OR COLUMN_NAME LIKE '%bathroom%')
        ORDER BY ORDINAL_POSITION;" 2>/dev/null || true
    
    echo ""
    echo -e "${BLUE}New table created:${NC}"
    docker exec dalila-db mysql -u dalila_user -pdalila_password dalila_db -e "SHOW TABLES LIKE 'property_categories';" 2>/dev/null || true
    
    echo ""
    echo -e "${BLUE}Triggers created:${NC}"
    docker exec dalila-db mysql -u dalila_user -pdalila_password dalila_db -e "SHOW TRIGGERS WHERE \`Trigger\` LIKE '%price%';" 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}NEXT STEPS:${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "1. Restart API:   ${YELLOW}docker-compose restart api${NC}"
    echo -e "2. Restart Admin: ${YELLOW}docker-compose restart admin${NC}"
    echo -e "3. Test creating a development with:"
    echo -e "   - Multiple categories"
    echo -e "   - Price in MXN"
    echo -e "   - Bedrooms range"
    echo ""
    echo -e "${BLUE}Backup location: ${YELLOW}$BACKUP_FILE${NC}"
    echo ""
    
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ MIGRATION FAILED!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Restoring from backup...${NC}"
    
    if [ -f "$BACKUP_FILE" ]; then
        docker exec -i dalila-db mysql -u dalila_user -pdalila_password dalila_db < "$BACKUP_FILE"
        echo -e "${GREEN}✓ Database restored from backup${NC}"
    else
        echo -e "${RED}❌ No backup file found! Database may be in inconsistent state.${NC}"
    fi
    
    exit 1
fi
