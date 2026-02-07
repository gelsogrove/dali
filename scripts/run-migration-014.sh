#!/bin/bash

# Migration 014: Add property_landing_pages table
# Run this script to add the property_landing_pages table to your database

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Migration 014: Add property_landing_pages Table    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION_FILE="$PROJECT_ROOT/database/014_add_property_landing_pages.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This will add the property_landing_pages table${NC}"
echo ""
echo "Please backup your database before proceeding!"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}📋 Migration Steps:${NC}"
echo "1. Open phpMyAdmin"
echo "2. Select database: dalila_db"
echo "3. Go to 'SQL' tab"
echo "4. Copy and paste the content from:"
echo "   $MIGRATION_FILE"
echo "5. Click 'Go' to execute"
echo ""
echo -e "${GREEN}Migration file ready at:${NC}"
echo "$MIGRATION_FILE"
echo ""
echo -e "${YELLOW}After running in phpMyAdmin:${NC}"
echo "- Verify the table was created"
echo "- Test the Landing Page tab in admin"
echo ""
