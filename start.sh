#!/bin/bash

# Dalila Property Management System - Quick Start Script
# This script sets up and starts the entire application

set -e

echo "🚀 Starting Dalila Property Management System..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env has passwords configured
if ! grep -q "MYSQL_PASSWORD=.\+" .env 2>/dev/null; then
    echo "⚠️  ATTENZIONE: File .env non contiene password!"
    echo ""
    echo "Per sviluppo locale, devi configurare password di TEST in .env:"
    echo ""
    echo "MYSQL_ROOT_PASSWORD=test_root_password"
    echo "MYSQL_PASSWORD=test_dalila_password"  
    echo "JWT_SECRET=test-jwt-secret-min-32-characters-for-local-dev-only"
    echo ""
    echo "⚠️  IMPORTANTE: Queste sono password di TEST per sviluppo!"
    echo "⚠️  MAI committare password reali su GitHub!"
    echo ""
    read -p "Vuoi continuare comunque? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ All services are running!"
echo ""
echo "📱 Access your applications:"
echo "   • Backend API:    http://localhost:8080/api"
echo "   • Admin Panel:    http://localhost:5174"
echo "   • MySQL:          localhost:3306"
echo ""
echo "🔐 Default Login Credentials:"
echo "   Email:    admin@dalila.com"
echo "   Password: Admin@123"
echo ""
echo "⚠️  IMPORTANT: Change these credentials in production!"
echo ""
echo "📖 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
echo "🎉 Setup complete! Happy coding!"
