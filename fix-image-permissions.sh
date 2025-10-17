#!/bin/bash

# Quick fix script for image permissions
# Run this script on your VPS to fix image serving issues

echo "🔧 Fixing image permissions and serving issues..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if public directory exists
if [ ! -d "public" ]; then
    print_error "Public directory not found!"
    exit 1
fi

# Fix permissions for public directory
print_status "Fixing permissions for public directory..."
chmod -R 755 public/
find public/ -type f -exec chmod 644 {} \;

# Specifically fix image files
print_status "Fixing permissions for image files..."
find public/storage/ -name "*.webp" -exec chmod 644 {} \;
find public/storage/ -name "*.jpg" -exec chmod 644 {} \;
find public/storage/ -name "*.jpeg" -exec chmod 644 {} \;
find public/storage/ -name "*.png" -exec chmod 644 {} \;
find public/storage/ -name "*.gif" -exec chmod 644 {} \;

# Check specific file
if [ -f "public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp" ]; then
    print_status "✅ Target image file found and permissions fixed"
    ls -la "public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
else
    print_warning "⚠️  Target image file not found"
    print_status "Available files in package directory:"
    ls -la public/storage/package/ | head -10
fi

# Restart Docker containers
print_status "Restarting Docker containers..."
docker-compose -f docker-compose.prod.yml restart app

# Wait a moment
sleep 5

# Test the specific image URL
print_status "Testing image URL..."
if curl -I "http://localhost:4000/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp" 2>/dev/null | grep -q "200 OK"; then
    print_status "✅ Image is now accessible!"
else
    print_warning "⚠️  Image might still not be accessible"
    print_status "Checking container logs..."
    docker-compose -f docker-compose.prod.yml logs app --tail=10
fi

print_status "🎉 Permission fix completed!"
print_status "Test your image: https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
