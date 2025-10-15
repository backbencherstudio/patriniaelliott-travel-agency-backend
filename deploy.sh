#!/bin/bash

# Production Deployment Script for Travel Agency Backend
# This script builds and deploys the application for production

echo "🚀 Starting Production Deployment..."

# Set environment
export NODE_ENV=production

# Build the application
echo "📦 Building application..."
yarn build:prod

# Verify build output
echo "🔍 Verifying build output..."
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    echo "❌ Build failed - dist/public directory not found"
    echo "💡 Make sure nest-cli.json includes '../public/**/*' in assets"
    exit 1
fi

echo "✅ Build successful - dist/public directory found"

# Build Docker image for production
echo "🐳 Building Docker image..."
docker build -t travel-agency-backend:latest .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start production containers
echo "🚀 Starting production containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment completed!"
echo "🌐 Application should be available at: 31.97.137.218:4000"
echo "📚 API Documentation: 31.97.137.218:4000/api/docs"
echo "📁 Static files: 31.97.137.218:4000/public/storage/..."

# Show running containers
echo "📋 Running containers:"
docker-compose -f docker-compose.prod.yml ps
