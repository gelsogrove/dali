#!/bin/bash

# DALILA - Avvio Semplice
# Porte FISSE: FE=5173, Admin=5174, API=8080

cd "$(dirname "$0")/.."

echo "🧹 Pulizia..."
pkill -f "vite" 2>/dev/null
pkill -f "concurrently" 2>/dev/null
docker-compose down > /dev/null 2>&1

echo "🚀 Avvio Docker..."
docker-compose up -d > /dev/null 2>&1
docker stop dalila-admin > /dev/null 2>&1  # Ferma admin Docker (usiamo locale)
sleep 10

echo "🌐 Avvio FE + Admin..."
(cd FE && npm run dev > /tmp/fe.log 2>&1) &
(cd admin && npm run dev > /tmp/admin.log 2>&1) &

sleep 6

echo ""
echo "✅ SERVIZI ATTIVI:"
echo "   Frontend:  http://localhost:5173"
echo "   Admin:     http://localhost:5174"  
echo "   API:       http://localhost:8080/api"
echo ""
echo "📝 Login Admin: admin@dalila.com / Admin@123"
echo ""
echo "🛑 Ferma tutto: ./scripts/stop-all.sh"
