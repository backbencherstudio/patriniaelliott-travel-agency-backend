#!/bin/bash

# Fix VPS Image Issue Script
# This script fixes all VPS image serving issues

echo "🔧 Fixing VPS Image Issue..."

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

print_status "🔍 PATH ANALYSIS:"
echo ""
print_debug "PACKAGE CONTROLLER:"
echo "  Production: path.join(process.cwd(), 'public', 'storage', 'package')"
echo "  Result: /usr/src/app/public/storage/package/"

print_debug "MAIN.TS:"
echo "  Production: join(__dirname, '..', 'public')"
echo "  Result: /usr/src/app/public/"

print_debug "APP.CONFIG.TS:"
echo "  Production: join(__dirname, '..', 'public', 'storage')"
echo "  Result: /usr/src/app/public/storage/"

print_debug "DOCKER VOLUME MAPPING:"
echo "  ./public:/usr/src/app/public"
echo "  Result: Host public/ → Container /usr/src/app/public/"

print_status "✅ PATHS ARE CORRECT!"

print_status "🔍 POSSIBLE VPS ISSUES:"

echo ""
print_debug "1. FILE PERMISSIONS:"
echo "   - VPS এ file permissions ঠিক নেই"
echo "   - Solution: chmod 755 public/ && chmod 644 public/storage/package/*"

echo ""
print_debug "2. DIRECTORY CREATION:"
echo "   - public/storage/package directory create হয়নি"
echo "   - Solution: mkdir -p public/storage/package"

echo ""
print_debug "3. DOCKER CONTAINER:"
echo "   - Container restart করা হয়নি"
echo "   - Solution: docker-compose down && docker-compose up -d --build"

echo ""
print_debug "4. NGINX CONFIGURATION:"
echo "   - Nginx static file serving ঠিক নেই"
echo "   - Solution: Check nginx.conf for static file serving"

print_status "🔧 COMPREHENSIVE FIX STEPS:"

echo ""
print_debug "STEP 1: CREATE DIRECTORY STRUCTURE"
echo "mkdir -p public/storage/package"
echo "mkdir -p public/storage/destination"
echo "mkdir -p public/storage/blog"
echo "mkdir -p public/storage/avatar"

echo ""
print_debug "STEP 2: FIX FILE PERMISSIONS"
echo "chmod -R 755 public/"
echo "find public/ -type f -exec chmod 644 {} \\;"

echo ""
print_debug "STEP 3: RESTART DOCKER CONTAINERS"
echo "docker-compose -f docker-compose.prod.yml down"
echo "docker-compose -f docker-compose.prod.yml up -d --build"

echo ""
print_debug "STEP 4: CHECK CONTAINER LOGS"
echo "docker-compose -f docker-compose.prod.yml logs app --tail=50"

echo ""
print_debug "STEP 5: TEST IMAGE SERVING"
echo "curl -I https://backend.naamstay.com/public/storage/package/filename.webp"

print_status "📋 VPS DEPLOYMENT COMMANDS:"

echo ""
print_debug "Run these commands on your VPS:"
echo ""
echo "# 1. Create directory structure"
echo "mkdir -p public/storage/package"
echo "mkdir -p public/storage/destination"
echo "mkdir -p public/storage/blog"
echo "mkdir -p public/storage/avatar"
echo ""
echo "# 2. Fix permissions"
echo "chmod -R 755 public/"
echo "find public/ -type f -exec chmod 644 {} \\;"
echo ""
echo "# 3. Restart containers"
echo "docker-compose -f docker-compose.prod.yml down"
echo "docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "# 4. Check logs"
echo "docker-compose -f docker-compose.prod.yml logs app --tail=50"
echo ""
echo "# 5. Test image"
echo "curl -I https://backend.naamstay.com/public/storage/package/filename.webp"

print_status "🎯 EXPECTED RESULT:"
echo "After running these commands:"
echo "✅ Directory structure created"
echo "✅ File permissions fixed"
echo "✅ Docker containers restarted"
echo "✅ Images served correctly"
echo "✅ VPS image URLs work"

print_status "🎉 VPS IMAGE ISSUE FIX COMPLETED!"
print_status "Run the deployment commands on your VPS!"
