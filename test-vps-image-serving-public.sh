#!/bin/bash

# VPS Image Serving Test Script - Public Endpoints
# This script tests image serving without authentication

echo "🧪 Testing VPS Image Serving - Public Endpoints..."

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

# Test 1: Check if public directory exists
print_status "Test 1: Checking public directory structure..."
if [ -d "public" ]; then
    print_status "✅ Public directory exists"
    if [ -d "public/storage" ]; then
        print_status "✅ Storage directory exists"
        if [ -d "public/storage/package" ]; then
            print_status "✅ Package directory exists"
        else
            print_warning "⚠️  Package directory missing"
            print_status "Creating package directory..."
            mkdir -p public/storage/package
        fi
    else
        print_warning "⚠️  Storage directory missing"
        print_status "Creating storage directory..."
        mkdir -p public/storage/package
    fi
else
    print_error "❌ Public directory not found!"
    exit 1
fi

# Test 2: Check file permissions
print_status "Test 2: Checking file permissions..."
chmod -R 755 public/
find public/ -type f -exec chmod 644 {} \;
print_status "✅ File permissions set"

# Test 3: Check if target image file exists
TARGET_FILE="public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
print_status "Test 3: Checking target image file..."
if [ -f "$TARGET_FILE" ]; then
    print_status "✅ Target image file exists"
    ls -la "$TARGET_FILE"
else
    print_warning "⚠️  Target image file not found"
    print_status "Available files in package directory:"
    ls -la public/storage/package/ | head -10
fi

# Test 4: Check Docker container status
print_status "Test 4: Checking Docker container status..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "backend-prod.*Up"; then
    print_status "✅ Backend container is running"
else
    print_warning "⚠️  Backend container is not running"
    print_status "Starting containers..."
    docker-compose -f docker-compose.prod.yml up -d
    sleep 10
fi

# Test 5: Check container file system
print_status "Test 5: Checking container file system..."
if docker exec backend-prod ls -la /usr/src/app/public/storage/package/ > /dev/null 2>&1; then
    print_status "✅ Container file system accessible"
    print_debug "Files in container package directory:"
    docker exec backend-prod ls -la /usr/src/app/public/storage/package/ | head -5
else
    print_warning "⚠️  Cannot access container file system"
fi

# Test 6: Test public endpoints (no authentication required)
print_status "Test 6: Testing public endpoints..."

# Test home page
print_debug "Testing home page endpoint..."
if curl -s "https://backend.naamstay.com/api/page/home" | grep -q "success"; then
    print_status "✅ Home page endpoint accessible"
else
    print_warning "⚠️  Home page endpoint not accessible"
fi

# Test package search (public endpoint)
print_debug "Testing package search endpoint..."
if curl -s "https://backend.naamstay.com/api/application/packages/search" | grep -q "success"; then
    print_status "✅ Package search endpoint accessible"
else
    print_warning "⚠️  Package search endpoint not accessible"
fi

# Test 7: Test local image serving
print_status "Test 7: Testing local image serving..."
TEST_URL="http://localhost:4000/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
print_debug "Testing URL: $TEST_URL"

if curl -I "$TEST_URL" 2>/dev/null | grep -q "200 OK"; then
    print_status "✅ Image is accessible locally!"
else
    print_warning "⚠️  Image not accessible locally"
    print_debug "Response:"
    curl -I "$TEST_URL" 2>/dev/null || true
fi

# Test 8: Check environment variables
print_status "Test 8: Checking environment variables..."
if docker exec backend-prod env | grep -q "APP_URL=https://backend.naamstay.com"; then
    print_status "✅ APP_URL is set correctly"
else
    print_warning "⚠️  APP_URL not set correctly"
    print_debug "Current APP_URL:"
    docker exec backend-prod env | grep APP_URL || true
fi

# Test 9: Check application logs
print_status "Test 9: Checking application logs..."
print_debug "Recent logs:"
docker-compose -f docker-compose.prod.yml logs app --tail=20

# Test 10: Test external URL (if accessible)
print_status "Test 10: Testing external URL..."
EXTERNAL_URL="https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
print_debug "Testing external URL: $EXTERNAL_URL"

if curl -I "$EXTERNAL_URL" 2>/dev/null | grep -q "200 OK"; then
    print_status "✅ Image is accessible externally!"
    print_status "🎉 SUCCESS: Image serving is working perfectly!"
else
    print_warning "⚠️  Image not accessible externally"
    print_debug "Response:"
    curl -I "$EXTERNAL_URL" 2>/dev/null || true
fi

# Test 11: Test with different image files (if any exist)
print_status "Test 11: Testing with available image files..."
if [ -d "public/storage/package" ] && [ "$(ls -A public/storage/package)" ]; then
    print_debug "Available image files:"
    ls -la public/storage/package/ | grep -E '\.(webp|jpg|jpeg|png|gif)$' | head -3
    
    # Test first available image
    FIRST_IMAGE=$(ls public/storage/package/ | grep -E '\.(webp|jpg|jpeg|png|gif)$' | head -1)
    if [ ! -z "$FIRST_IMAGE" ]; then
        TEST_IMAGE_URL="https://backend.naamstay.com/public/storage/package/$FIRST_IMAGE"
        print_debug "Testing with first available image: $TEST_IMAGE_URL"
        
        if curl -I "$TEST_IMAGE_URL" 2>/dev/null | grep -q "200 OK"; then
            print_status "✅ First available image is accessible!"
        else
            print_warning "⚠️  First available image not accessible"
        fi
    fi
else
    print_warning "⚠️  No image files found in package directory"
fi

# Summary
echo ""
print_status "📋 TEST SUMMARY:"
echo "1. Public directory structure: ✅"
echo "2. File permissions: ✅"
echo "3. Target image file: $(if [ -f "$TARGET_FILE" ]; then echo "✅"; else echo "⚠️"; fi)"
echo "4. Docker container: $(if docker-compose -f docker-compose.prod.yml ps | grep -q "backend-prod.*Up"; then echo "✅"; else echo "⚠️"; fi)"
echo "5. Container file system: $(if docker exec backend-prod ls -la /usr/src/app/public/storage/package/ > /dev/null 2>&1; then echo "✅"; else echo "⚠️"; fi)"
echo "6. Public endpoints: $(if curl -s "https://backend.naamstay.com/api/page/home" | grep -q "success"; then echo "✅"; else echo "⚠️"; fi)"
echo "7. Local image serving: $(if curl -I "$TEST_URL" 2>/dev/null | grep -q "200 OK"; then echo "✅"; else echo "⚠️"; fi)"
echo "8. Environment variables: $(if docker exec backend-prod env | grep -q "APP_URL=https://backend.naamstay.com"; then echo "✅"; else echo "⚠️"; fi)"
echo "9. External image serving: $(if curl -I "$EXTERNAL_URL" 2>/dev/null | grep -q "200 OK"; then echo "✅"; else echo "⚠️"; fi)"

echo ""
print_status "🎯 FINAL RESULT:"
if curl -I "$EXTERNAL_URL" 2>/dev/null | grep -q "200 OK"; then
    print_status "🎉 SUCCESS: Your image URL is working!"
    print_status "✅ Image is being saved and served correctly"
    print_status "✅ URL: https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
else
    print_warning "⚠️  Image serving needs attention"
    print_status "Check the issues above and run the deployment script"
fi

echo ""
print_status "🔧 CORRECT TEST COMMANDS:"
echo "1. Test public endpoints:"
echo "   curl -s https://backend.naamstay.com/api/page/home"
echo "   curl -s https://backend.naamstay.com/api/application/packages/search"
echo ""
echo "2. Test image serving:"
echo "   curl -I https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
echo ""
echo "3. Test local image serving:"
echo "   curl -I http://localhost:4000/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
echo ""
echo "4. Check container logs:"
echo "   docker-compose -f docker-compose.prod.yml logs app"
echo ""
echo "5. Check file system:"
echo "   docker exec backend-prod ls -la /usr/src/app/public/storage/package/"
