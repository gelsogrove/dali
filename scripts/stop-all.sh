#!/bin/bash

# Script per fermare tutti i servizi Dalila
# Uso: ./scripts/stop-all.sh

echo "🛑 Fermando tutti i servizi Dalila..."

# Ferma processi Node/Vite
pkill -f "vite" 2>/dev/null
pkill -f "concurrently" 2>/dev/null
pkill -f "node.*dev" 2>/dev/null

# Libera porte
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null

# Ferma Docker
cd "$(dirname "$0")/.."
docker-compose down

echo ""
echo "✅ Tutti i servizi fermati"
echo ""
