#!/bin/bash

# Test Image Save and Serve Script
# This script tests if images are being saved and served correctly

echo "🔍 Testing Image Save and Serve..."

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
if [ ! -f "src/main.ts" ]; then
    print_error "main.ts not found! Please run this script from your project root directory."
    exit 1
fi

print_status "🔍 PATH ANALYSIS:"

echo ""
print_debug "1. PACKAGE CONTROLLER PATH:"
echo "   Production: path.join(process.cwd(), 'public', 'storage', 'package')"
echo "   Result: /usr/src/app/public/storage/package/ (Docker container)"
echo "   Development: /project/public/storage/package/"

echo ""
print_debug "2. MAIN.TS PATH:"
echo "   Production: join(__dirname, '..', 'public')"
echo "   Result: /usr/src/app/public/ (goes up from dist to public)"
echo "   Development: /project/public/"

echo ""
print_debug "3. STATIC FILE SERVING:"
echo "   Route: /public/storage"
echo "   Full path: /usr/src/app/public/storage/package/filename.webp"
echo "   URL: https://your-domain.com/public/storage/package/filename.webp"

print_status "🎯 PATH CONSISTENCY CHECK:"

# Check if paths are consistent
if grep -q "join(__dirname, '..', 'public')" src/main.ts; then
    print_status "✅ main.ts has correct production path"
else
    print_error "❌ main.ts has incorrect production path"
fi

if grep -q "path.join(process.cwd(), 'public', 'storage', 'package')" src/modules/admin/package/package.controller.ts; then
    print_status "✅ package controller has correct storage path"
else
    print_error "❌ package controller has incorrect storage path"
fi

print_status "🔧 TESTING STEPS:"

echo ""
print_debug "1. CREATE PACKAGE WITH IMAGE:"
echo "   POST /api/admin/package"
echo "   Upload image file"
echo "   Check console logs for:"
echo "   - [MULTER DEBUG] Resolved storagePath"
echo "   - [MULTER DEBUG] Directory created successfully"
echo "   - [MULTER FILENAME DEBUG] Generated filename"

echo ""
print_debug "2. CHECK IMAGE SAVE:"
echo "   Look for file in: public/storage/package/"
echo "   File should exist with generated filename"

echo ""
print_debug "3. TEST IMAGE SERVING:"
echo "   GET /public/storage/package/filename.webp"
echo "   Should return 200 OK with image content"
echo "   Check console logs for:"
echo "   - [STATIC FILE DEBUG] Static file requested"
echo "   - [STATIC FILE DEBUG] File exists: true"

print_status "🚀 EXPECTED RESULT:"

echo ""
print_debug "After fix:"
echo "✅ Package controller saves to: /usr/src/app/public/storage/package/"
echo "✅ Main.ts serves from: /usr/src/app/public/storage/package/"
echo "✅ Image URL works: https://your-domain.com/public/storage/package/filename.webp"
echo "✅ Both paths resolve to same location"

print_status "📋 DEBUGGING COMMANDS:"

echo ""
print_debug "1. Check if image file exists:"
echo "   ls -la public/storage/package/"

echo ""
print_debug "2. Check application logs:"
echo "   docker-compose logs app | grep -E 'MULTER DEBUG|STATIC FILE DEBUG'"

echo ""
print_debug "3. Test image URL:"
echo "   curl -I https://your-domain.com/public/storage/package/filename.webp"

echo ""
print_debug "4. Check file permissions:"
echo "   ls -la public/storage/package/filename.webp"

print_status "🎉 IMAGE SAVE AND SERVE TEST COMPLETED!"

echo ""
print_warning "⚠️  IMPORTANT:"
echo "Make sure to:"
echo "1. Restart your application after path changes"
echo "2. Check console logs for debug messages"
echo "3. Verify file exists in public/storage/package/"
echo "4. Test image URL in browser or with curl"
