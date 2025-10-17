#!/bin/bash

# Complete VPS Fix Script
echo "🚀 Starting Complete VPS Fix..."

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

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_warning "This script requires root privileges. Please run with sudo."
    exit 1
fi

print_status "🔧 STEP 1: Fixing File Permissions..."

# Create directory structure
print_debug "Creating directory structure..."
mkdir -p public/storage/package
mkdir -p public/storage/destination
mkdir -p public/storage/blog
mkdir -p public/storage/avatar
mkdir -p public/storage/website-info
mkdir -p public/storage/attachment

# Fix permissions
print_debug "Setting permissions..."
chmod -R 755 public/
find public/ -type d -exec chmod 755 {} \;
find public/ -type f -exec chmod 644 {} \;

# Set ownership
print_debug "Setting ownership..."
chown -R www-data:www-data public/ 2>/dev/null || chown -R nginx:nginx public/ 2>/dev/null || echo "Skipping ownership change"

print_status "✅ File permissions fixed!"

print_status "🐳 STEP 2: Restarting Docker Containers..."

# Stop containers
print_debug "Stopping containers..."
docker-compose -f docker-compose.prod.yml down

# Rebuild and start
print_debug "Rebuilding and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
print_debug "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

print_status "✅ Docker containers restarted!"

print_status "🌐 STEP 3: Setting up Nginx..."

# Backup existing config
print_debug "Backing up existing nginx config..."
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup 2>/dev/null || echo "No existing config to backup"

# Install new config
print_debug "Installing new nginx config..."
cp nginx.conf /etc/nginx/sites-available/backend.naamstay.com

# Create symbolic link
print_debug "Creating symbolic link..."
ln -sf /etc/nginx/sites-available/backend.naamstay.com /etc/nginx/sites-enabled/

# Remove default site
print_debug "Removing default site..."
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
print_debug "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    print_debug "Reloading nginx..."
    systemctl reload nginx
    systemctl restart nginx
    
    print_status "✅ Nginx setup completed!"
else
    print_error "❌ Nginx configuration has errors!"
    exit 1
fi

print_status "🧪 STEP 4: Testing Image Serving..."

# Wait for containers to be ready
print_debug "Waiting for containers to be ready..."
sleep 10

# Test image URL
print_debug "Testing image URL..."
curl -I https://backend.naamstay.com/public/storage/package/1760703267344_bbb95ddde52d8b9f_1759900310395_d10749b95fad88e70_h4.webp

print_status "📊 STEP 5: Final Status Check..."

# Check container logs
print_debug "Checking application logs..."
docker-compose -f docker-compose.prod.yml logs app --tail=10

# Check nginx status
print_debug "Checking nginx status..."
systemctl status nginx --no-pager

# Check directory structure
print_debug "Checking directory structure..."
ls -la public/storage/

print_status "🎉 VPS FIX COMPLETED!"
print_status "Your image serving should now work correctly!"

print_warning "⚠️ If images still don't work:"
echo "1. Check if the image file exists in public/storage/package/"
echo "2. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "3. Check application logs: docker-compose -f docker-compose.prod.yml logs app"
echo "4. Test with: curl -I https://backend.naamstay.com/public/storage/package/filename.webp"
