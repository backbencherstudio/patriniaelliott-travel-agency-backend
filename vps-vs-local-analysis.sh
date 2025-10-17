#!/bin/bash

# VPS vs Local Analysis Script
# This script compares local and VPS configurations

echo "🔍 VPS vs Local Analysis..."

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

print_status "🔍 ANALYSIS: Local vs VPS Image Serving"

echo ""
print_status "✅ LOCAL WORKING:"
echo "URL: https://dreams-applies-homepage-basic.trycloudflare.com/public/storage/package/1760696056702_a27109781db328f3c_1759900310395_d10749b95fad88e70_h4.webp"
echo "Status: ✅ Working (Image loads successfully)"

echo ""
print_error "❌ VPS NOT WORKING:"
echo "URL: https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
echo "Error: File not found"
echo "Path: /var/www/naamstay.com/patriniaelliott-travel-agency-backend/dist/public/storage/package/"

echo ""
print_status "🔍 ROOT CAUSE ANALYSIS:"

echo ""
print_debug "1. PATH DIFFERENCE:"
echo "   Local: Uses correct path (public/storage/package/)"
echo "   VPS: Uses wrong path (dist/public/storage/package/)"

echo ""
print_debug "2. CODE DIFFERENCE:"
echo "   Local: Has modified main.ts with correct path"
echo "   VPS: Still using old main.ts with dist/public path"

echo ""
print_debug "3. CONFIGURATION DIFFERENCE:"
echo "   Local: Proper static file serving configuration"
echo "   VPS: Missing volume mapping and APP_URL"

echo ""
print_status "🔧 SOLUTION STEPS:"

echo ""
print_status "Step 1: Check VPS Current Code"
echo "Run on VPS:"
echo "cat src/main.ts | grep -A 2 -B 2 'publicPath'"
echo "cat src/config/app.config.ts | grep -A 2 -B 2 'rootUrl'"

echo ""
print_status "Step 2: Fix VPS Code"
echo "Run on VPS:"
echo "# Fix main.ts"
echo "sed -i \"s|join(process.cwd(), 'dist', 'public')|join(__dirname, 'public')|g\" src/main.ts"
echo ""
echo "# Fix app.config.ts"
echo "sed -i \"s|join(process.cwd(), 'dist', 'public', 'storage')|join(__dirname, '..', 'public', 'storage')|g\" src/config/app.config.ts"

echo ""
print_status "Step 3: Fix Docker Configuration"
echo "Run on VPS:"
echo "# Add APP_URL to docker-compose.prod.yml"
echo "sed -i '/- REDIS_PORT=6379/a\\      - APP_URL=https://backend.naamstay.com' docker-compose.prod.yml"
echo ""
echo "# Add volume mapping to docker-compose.prod.yml"
echo "sed -i '/depends_on:/i\\    volumes:\\n      - ./public:/usr/src/app/public' docker-compose.prod.yml"

echo ""
print_status "Step 4: Rebuild and Test"
echo "Run on VPS:"
echo "# Stop containers"
echo "docker-compose -f docker-compose.prod.yml down"
echo ""
echo "# Set permissions"
echo "chmod -R 755 public/"
echo "find public/ -type f -exec chmod 644 {} \\;"
echo ""
echo "# Update .env"
echo "echo 'APP_URL=https://backend.naamstay.com' >> .env"
echo ""
echo "# Rebuild and start"
echo "docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "# Test"
echo "curl -I https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"

echo ""
print_status "🎯 EXPECTED RESULT:"
echo "After fix, VPS should work like local:"
echo "✅ https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"

echo ""
print_warning "⚠️  KEY DIFFERENCES:"
echo "1. Local has modified main.ts with correct path"
echo "2. VPS still has old main.ts with dist/public path"
echo "3. Local has proper Docker configuration"
echo "4. VPS missing volume mapping and APP_URL"

echo ""
print_status "🚀 QUICK FIX COMMAND:"
echo "Run this on VPS:"
echo "chmod +x fix-vps-path-issue.sh && ./fix-vps-path-issue.sh"
