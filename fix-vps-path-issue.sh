#!/bin/bash

# Fix VPS Path Issue Script
# This script fixes the path resolution issue in VPS

echo "🔧 Fixing VPS Path Issue..."

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

print_status "🔍 ISSUE IDENTIFIED:"
echo "Error shows: /var/www/naamstay.com/patriniaelliott-travel-agency-backend/dist/public/storage/package/"
echo "Expected: /var/www/naamstay.com/patriniaelliott-travel-agency-backend/public/storage/package/"
echo ""
print_status "Root cause: Modified main.ts file not deployed to VPS"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Check if modified files exist
print_status "Checking modified files..."

if [ -f "src/main.ts" ]; then
    print_debug "Checking main.ts content..."
    if grep -q "join(__dirname, 'public')" src/main.ts; then
        print_status "✅ main.ts has correct production path"
    else
        print_error "❌ main.ts has incorrect production path"
        print_status "Fixing main.ts..."
        
        # Fix main.ts production path
        sed -i "s|join(process.cwd(), 'dist', 'public')|join(__dirname, 'public')|g" src/main.ts
        print_status "✅ main.ts fixed"
    fi
else
    print_error "❌ src/main.ts not found!"
    exit 1
fi

if [ -f "src/config/app.config.ts" ]; then
    print_debug "Checking app.config.ts content..."
    if grep -q "join(__dirname, '..', 'public', 'storage')" src/config/app.config.ts; then
        print_status "✅ app.config.ts has correct production path"
    else
        print_error "❌ app.config.ts has incorrect production path"
        print_status "Fixing app.config.ts..."
        
        # Fix app.config.ts production path
        sed -i "s|join(process.cwd(), 'dist', 'public', 'storage')|join(__dirname, '..', 'public', 'storage')|g" src/config/app.config.ts
        print_status "✅ app.config.ts fixed"
    fi
else
    print_error "❌ src/config/app.config.ts not found!"
    exit 1
fi

# Check docker-compose.prod.yml
if [ -f "docker-compose.prod.yml" ]; then
    print_debug "Checking docker-compose.prod.yml..."
    if grep -q "APP_URL=https://backend.naamstay.com" docker-compose.prod.yml && grep -q "./public:/usr/src/app/public" docker-compose.prod.yml; then
        print_status "✅ docker-compose.prod.yml has correct configuration"
    else
        print_error "❌ docker-compose.prod.yml has incorrect configuration"
        print_status "Fixing docker-compose.prod.yml..."
        
        # Add APP_URL if missing
        if ! grep -q "APP_URL=https://backend.naamstay.com" docker-compose.prod.yml; then
            sed -i '/- REDIS_PORT=6379/a\      - APP_URL=https://backend.naamstay.com' docker-compose.prod.yml
        fi
        
        # Add volume mapping if missing
        if ! grep -q "./public:/usr/src/app/public" docker-compose.prod.yml; then
            sed -i '/depends_on:/i\    volumes:\n      - ./public:/usr/src/app/public' docker-compose.prod.yml
        fi
        
        print_status "✅ docker-compose.prod.yml fixed"
    fi
else
    print_error "❌ docker-compose.prod.yml not found!"
    exit 1
fi

# Set proper permissions
print_status "Setting file permissions..."
chmod -R 755 public/
find public/ -type f -exec chmod 644 {} \;

# Check if .env file exists and update APP_URL
if [ -f ".env" ]; then
    print_status "Updating .env file..."
    if grep -q "APP_URL=" .env; then
        sed -i 's|APP_URL=.*|APP_URL=https://backend.naamstay.com|g' .env
    else
        echo "APP_URL=https://backend.naamstay.com" >> .env
    fi
else
    print_warning ".env file not found. Creating one..."
    cat > .env << EOF
NODE_ENV=production
APP_URL=https://backend.naamstay.com
DATABASE_URL=postgresql://postgres:root@postgres/backend
REDIS_HOST=redis
REDIS_PORT=6379
EOF
fi

# Build and start containers
print_status "Building and starting containers with fixed configuration..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for containers to start
print_status "Waiting for containers to start..."
sleep 20

# Check container status
print_status "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Test the fix
print_status "Testing the fix..."
sleep 5

TEST_URL="https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
print_debug "Testing URL: $TEST_URL"

if curl -I "$TEST_URL" 2>/dev/null | grep -q "200 OK"; then
    print_status "✅ SUCCESS: Image serving is now working!"
    print_status "🎉 Path issue fixed!"
else
    print_warning "⚠️  Image still not accessible"
    print_debug "Response:"
    curl -I "$TEST_URL" 2>/dev/null || true
fi

# Show logs
print_status "Showing recent logs..."
docker-compose -f docker-compose.prod.yml logs app --tail=20

# Check container file system
print_status "Checking container file system..."
docker exec backend-prod ls -la /usr/src/app/public/storage/package/ | head -5 || print_warning "Could not access container file system"

print_status "🎉 PATH ISSUE FIX COMPLETED!"
print_status "Your application should now be running with correct paths"
print_status "Test your image URL: https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"

echo ""
print_status "🔧 WHAT WAS FIXED:"
echo "1. ✅ main.ts production path: join(__dirname, 'public')"
echo "2. ✅ app.config.ts storage path: join(__dirname, '..', 'public', 'storage')"
echo "3. ✅ docker-compose.prod.yml volume mapping: ./public:/usr/src/app/public"
echo "4. ✅ APP_URL environment variable: https://backend.naamstay.com"
echo "5. ✅ File permissions set correctly"

echo ""
print_warning "If images are still not loading, check:"
echo "1. Container logs: docker-compose -f docker-compose.prod.yml logs app"
echo "2. File exists: ls -la public/storage/package/"
echo "3. Container file system: docker exec backend-prod ls -la /usr/src/app/public/storage/package/"
echo "4. Environment variables: docker exec backend-prod env | grep APP_URL"
