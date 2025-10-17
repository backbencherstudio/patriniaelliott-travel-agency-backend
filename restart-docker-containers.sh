#!/bin/bash

# Restart Docker Containers Script
echo "🐳 Restarting Docker Containers..."

# Stop all containers
echo "⏹️ Stopping containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old containers and images (optional)
echo "🗑️ Cleaning up old containers..."
docker system prune -f

# Rebuild and start containers
echo "🔨 Rebuilding and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Check container status
echo "📊 Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo "📝 Showing application logs..."
docker-compose -f docker-compose.prod.yml logs app --tail=20

echo "✅ Docker containers restarted!"
