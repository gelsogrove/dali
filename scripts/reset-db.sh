#!/bin/bash
# Reset database to fresh state

echo "🗑️  Stopping containers..."
docker-compose down

echo "🗑️  Removing database volume..."
docker volume rm dalila_mysql_data 2>/dev/null || echo "Volume already removed"

echo "🚀 Starting containers (DB will reinitialize)..."
docker-compose up -d mysql

echo "⏳ Waiting for MySQL to be ready..."
sleep 10

echo "✅ Database reset complete!"
echo "You can now start other services: docker-compose up -d"
