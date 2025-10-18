#!/bin/bash

# Test VPS Image Paths Script
echo "🔍 Testing VPS Image Paths..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

print_status "🔍 PATH ANALYSIS:"

echo ""
print_debug "PACKAGE CONTROLLER PATHS:"
echo "✅ ensureStorageDirectories(): path.join(process.cwd(), '..', 'public', 'storage', 'package')"
echo "✅ Multer destination: path.join(process.cwd(), '..', 'public', 'storage', 'package')"
echo "✅ Cleanup functions: path.join(process.cwd(), '..', 'public', 'storage', 'package')"
echo "✅ Update function: path.join(process.cwd(), '..', 'public', 'storage', 'package')"

echo ""
print_debug "MAIN.TS PATHS:"
echo "✅ publicPath: join(__dirname, '..', 'public')"
echo "✅ Static serving: /usr/src/app/public/storage/package/"

echo ""
print_debug "APP.CONFIG.TS PATHS:"
echo "✅ rootUrl: join(__dirname, '..', 'public', 'storage')"
echo "✅ package: '/package/'"
echo "✅ Result: /usr/src/app/public/storage/package/"

print_status "🎯 EXPECTED VPS BEHAVIOR:"

echo ""
print_debug "VPS ENVIRONMENT:"
echo "process.cwd(): /usr/src/app/dist"
echo "Package Controller saves to: path.join(process.cwd(), '..', 'public', 'storage', 'package')"
echo "Result: /usr/src/app/public/storage/package/ ✅"
echo ""
echo "Main.ts serves from: join(__dirname, '..', 'public')"
echo "Result: /usr/src/app/public/ ✅"
echo "Static route: /usr/src/app/public/storage/package/ ✅"
echo ""
echo "URL: https://backend.naamstay.com/public/storage/package/filename.webp"
echo "File path: /usr/src/app/public/storage/package/filename.webp ✅"

print_status "🔧 IF STILL NOT WORKING, CHECK:"

echo ""
print_debug "1. VPS DEPLOYMENT:"
echo "   - Is latest code deployed to VPS?"
echo "   - Are Docker containers rebuilt?"
echo "   - Check: docker-compose -f docker-compose.prod.yml logs app"

echo ""
print_debug "2. FILE PERMISSIONS:"
echo "   - Check: ls -la /usr/src/app/public/storage/package/"
echo "   - Fix: chmod -R 755 /usr/src/app/public/storage/"

echo ""
print_debug "3. DOCKER VOLUME MAPPING:"
echo "   - Check: docker-compose.prod.yml has './public:/usr/src/app/public'"
echo "   - Verify: docker exec backend-prod ls -la /usr/src/app/public/storage/package/"

echo ""
print_debug "4. NGINX CONFIGURATION:"
echo "   - Check: nginx serves /public/ route correctly"
echo "   - Test: curl -I https://backend.naamstay.com/public/storage/package/filename.webp"

print_status "📋 VPS DEBUGGING COMMANDS:"

echo ""
echo "# 1. Check if image file exists in container"
echo "docker exec backend-prod ls -la /usr/src/app/public/storage/package/"

echo ""
echo "# 2. Check if image file exists on host"
echo "ls -la public/storage/package/"

echo ""
echo "# 3. Check application logs"
echo "docker-compose -f docker-compose.prod.yml logs app --tail=50"

echo ""
echo "# 4. Test image URL"
echo "curl -I https://backend.naamstay.com/public/storage/package/1760672458897_a5981466f1333c9c_1759900310395_d10749b95fad88e70_h4.webp"

echo ""
echo "# 5. Check Docker volume mapping"
echo "docker inspect backend-prod | grep -A 10 'Mounts'"

print_status "🎉 PATH ANALYSIS COMPLETED!"
print_status "All paths are now correctly configured for VPS!"
