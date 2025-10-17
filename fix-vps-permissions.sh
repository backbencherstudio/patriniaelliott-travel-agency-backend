#!/bin/bash

# Fix VPS File Permissions Script
echo "🔧 Fixing VPS File Permissions..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p public/storage/package
mkdir -p public/storage/destination
mkdir -p public/storage/blog
mkdir -p public/storage/avatar
mkdir -p public/storage/website-info
mkdir -p public/storage/attachment

# Fix directory permissions
echo "🔐 Setting directory permissions..."
chmod -R 755 public/
find public/ -type d -exec chmod 755 {} \;

# Fix file permissions
echo "📄 Setting file permissions..."
find public/ -type f -exec chmod 644 {} \;

# Set ownership (if needed)
echo "👤 Setting ownership..."
chown -R www-data:www-data public/ 2>/dev/null || echo "Skipping ownership change (not root)"

echo "✅ File permissions fixed!"
echo "📋 Directory structure created:"
ls -la public/storage/