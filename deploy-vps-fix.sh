#!/bin/bash

# VPS Image Serving Fix Script
# Run this script on your VPS to fix image serving issues

echo "🚀 Starting VPS image serving fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Check if running in project directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found! Please run this script from your project root directory."
    exit 1
fi

# Check if public directory exists
if [ ! -d "public" ]; then
    print_error "Public directory not found!"
    exit 1
fi

print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Set proper permissions for public directory
print_status "Setting permissions for public directory..."
chmod -R 755 public/
find public/ -type f -exec chmod 644 {} \;

# Specifically fix image files
print_status "Fixing permissions for image files..."
find public/storage/ -name "*.webp" -exec chmod 644 {} \; 2>/dev/null || true
find public/storage/ -name "*.jpg" -exec chmod 644 {} \; 2>/dev/null || true
find public/storage/ -name "*.jpeg" -exec chmod 644 {} \; 2>/dev/null || true
find public/storage/ -name "*.png" -exec chmod 644 {} \; 2>/dev/null || true
find public/storage/ -name "*.gif" -exec chmod 644 {} \; 2>/dev/null || true

# Check specific file
TARGET_FILE="public/storage/package/1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp"
if [ -f "$TARGET_FILE" ]; then
    print_status "✅ Target image file found and permissions fixed"
    ls -la "$TARGET_FILE"
else
    print_warning "⚠️  Target image file not found"
    print_status "Available files in package directory:"
    ls -la public/storage/package/ | head -10
fi

# Check if .env file exists and update APP_URL
if [ -f ".env" ]; then
    print_status "Updating .env file with correct APP_URL..."
    if grep -q "APP_URL=" .env; then
        sed -i 's|APP_URL=.*|APP_URL=https://backend.naamstay.com|g' .env
    else
        echo "APP_URL=https://backend.naamstay.com" >> .env
    fi
else
    print_warning ".env file not found. Creating a basic one..."
    cat > .env << EOF
NODE_ENV=production
APP_URL=https://backend.naamstay.com
DATABASE_URL=postgresql://postgres:root@postgres/backend
REDIS_HOST=redis
REDIS_PORT=6379
EOF
fi

# Build and start containers
print_status "Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for containers to start
print_status "Waiting for containers to start..."
sleep 15

# Check container status
print_status "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Test image serving
print_status "Testing image serving..."
sleep 5

# Test the specific image URL
TEST_URL="http://localhost:4000/public/storage/package/1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp"
if curl -I "$TEST_URL" 2>/dev/null | grep -q "200 OK"; then
    print_status "✅ Image is now accessible locally!"
else
    print_warning "⚠️  Image might still not be accessible locally"
    print_debug "Testing with curl..."
    curl -I "$TEST_URL" || true
fi

# Show recent logs
print_status "Showing recent logs..."
docker-compose -f docker-compose.prod.yml logs app --tail=20

# Check container file system
print_status "Checking container file system..."
docker exec backend-prod ls -la /usr/src/app/public/storage/package/ | head -5 || print_warning "Could not access container file system"

print_status "🎉 Deployment completed!"
print_status "Your application should now be running at: https://backend.naamstay.com"
print_status "Test your image URL: https://backend.naamstay.com/public/storage/package/1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp"

echo ""
print_warning "If images are still not loading, check:"
echo "1. File permissions: ls -la public/storage/package/"
echo "2. Container logs: docker-compose -f docker-compose.prod.yml logs app"
echo "3. Container file system: docker exec backend-prod ls -la /usr/src/app/public/storage/package/"
echo "4. Nginx configuration (if using Nginx)"
echo "5. Firewall settings"

echo ""
print_status "To debug further, run:"
echo "docker exec -it backend-prod bash"
echo "ls -la /usr/src/app/public/storage/package/"
