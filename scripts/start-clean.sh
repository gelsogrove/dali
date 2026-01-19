#!/bin/bash

# Script per avvio pulito con porte fisse
# Uso: ./scripts/start-clean.sh

echo "🧹 Pulizia processi vecchi..."

# Ferma tutti i processi vite e node dev
pkill -f "vite" 2>/dev/null
pkill -f "concurrently" 2>/dev/null
sleep 2

# Libera le porte specifiche
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
sleep 1

echo "✅ Porte liberate"
echo ""
echo "🚀 Avvio servizi..."
echo ""

# Avvia Docker (MySQL + Backend + Admin container)
cd "$(dirname "$0")/.."
docker-compose up -d
echo "⏳ Attendo inizializzazione database (10s)..."
sleep 10

echo ""
echo "🌐 Frontend e Admin..."
echo ""

# Directory progetto
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Avvia FE e Admin in background con porte fisse
(cd "$PROJECT_DIR/FE" && npm run dev) > /tmp/dalila-fe.log 2>&1 &
(cd "$PROJECT_DIR/admin" && npm run dev) > /tmp/dalila-admin.log 2>&1 &

sleep 5

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║         ✅ DALILA - TUTTI I SERVIZI ATTIVI   ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo "  🌐 Frontend:  http://localhost:5173"
echo "  🔐 Admin:     http://localhost:5174"
echo "  ⚙️  API:       http://localhost:8080/api"
echo "  🗄️  MySQL:     localhost:3306"
echo ""
echo "  Login Admin:"
echo "    Email:    admin@dalila.com"
echo "    Password: Admin@123"
echo ""
echo "  📋 Log:"
echo "    tail -f /tmp/dalila-fe.log"
echo "    tail -f /tmp/dalila-admin.log"
echo "    docker-compose logs -f backend"
echo ""
echo "  🛑 Per fermare tutto:"
echo "    ./scripts/stop-all.sh"
echo ""
