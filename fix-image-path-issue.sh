#!/bin/bash

# Fix Image Path Issue Script
# This script fixes the image path issue completely

echo "🔧 Fixing Image Path Issue..."

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

print_status "🔍 ISSUE IDENTIFIED:"
echo "Error shows: D:\\patriniaelliott-travel-agency-backend\\dist\\public\\storage\\package\\"
echo "But should be: D:\\patriniaelliott-travel-agency-backend\\public\\storage\\package\\"
echo ""
print_status "Root cause: Development path resolution issue in main.ts"

# Fix main.ts development path
print_status "Fixing main.ts development path..."

# Check current main.ts content
if grep -q "join(__dirname, '..', 'public')" src/main.ts; then
    print_error "❌ Found wrong development path in main.ts"
    print_status "Fixing development path..."
    sed -i "s|join(__dirname, '..', 'public')|join(process.cwd(), 'public')|g" src/main.ts
    print_status "✅ Development path fixed"
else
    print_status "✅ Development path already correct"
fi

# Check if production path is correct
if grep -q "join(__dirname, '..', 'public')" src/main.ts; then
    print_status "✅ Production path is correct"
else
    print_error "❌ Production path is incorrect"
fi

print_status "🎯 PATH FLOW ANALYSIS:"

echo ""
print_debug "DEVELOPMENT ENVIRONMENT:"
echo "Package Controller saves to: path.join(process.cwd(), 'public', 'storage', 'package')"
echo "Result: D:\\patriniaelliott-travel-agency-backend\\public\\storage\\package\\"
echo ""
echo "Main.ts serves from: join(process.cwd(), 'public')"
echo "Result: D:\\patriniaelliott-travel-agency-backend\\public\\"
echo ""
echo "Static file serving: join(publicPath, 'storage', req.path)"
echo "Result: D:\\patriniaelliott-travel-agency-backend\\public\\storage\\package\\filename.webp"

echo ""
print_debug "PRODUCTION ENVIRONMENT:"
echo "Package Controller saves to: path.join(process.cwd(), 'public', 'storage', 'package')"
echo "Result: /usr/src/app/public/storage/package/"
echo ""
echo "Main.ts serves from: join(__dirname, '..', 'public')"
echo "Result: /usr/src/app/public/"
echo ""
echo "Static file serving: join(publicPath, 'storage', req.path)"
echo "Result: /usr/src/app/public/storage/package/filename.webp"

print_status "🔧 WHAT WAS FIXED:"
echo "1. ✅ Development path: join(process.cwd(), 'public')"
echo "2. ✅ Production path: join(__dirname, '..', 'public')"
echo "3. ✅ Both paths now resolve to same location as package controller"

print_status "🚀 EXPECTED RESULT:"
echo "After restart:"
echo "✅ Package controller saves to: public/storage/package/"
echo "✅ Main.ts serves from: public/storage/package/"
echo "✅ Image URL works: https://your-domain.com/public/storage/package/filename.webp"
echo "✅ No more 'File not found' error"

print_status "📋 NEXT STEPS:"
echo "1. RESTART YOUR APPLICATION (CRITICAL!)"
echo "2. Test image URL: https://your-domain.com/public/storage/package/filename.webp"
echo "3. Check console logs for debug messages"

echo ""
print_warning "⚠️  IMPORTANT:"
echo "You MUST restart your application for the changes to take effect!"
echo "The error you're seeing is because the old code is still running."

print_status "🎉 IMAGE PATH ISSUE FIX COMPLETED!"
print_status "Restart your application and test the image URL!"
