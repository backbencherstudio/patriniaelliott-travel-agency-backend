#!/bin/bash

# Setup Nginx Configuration Script
echo "🌐 Setting up Nginx configuration..."

# Backup existing nginx config
echo "💾 Backing up existing nginx config..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup 2>/dev/null || echo "No existing config to backup"

# Copy new nginx config
echo "📝 Installing new nginx config..."
sudo cp nginx.conf /etc/nginx/sites-available/backend.naamstay.com

# Create symbolic link
echo "🔗 Creating symbolic link..."
sudo ln -sf /etc/nginx/sites-available/backend.naamstay.com /etc/nginx/sites-enabled/

# Remove default site if exists
echo "🗑️ Removing default site..."
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid!"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    # Restart nginx
    echo "🔄 Restarting nginx..."
    sudo systemctl restart nginx
    
    # Check nginx status
    echo "📊 Checking nginx status..."
    sudo systemctl status nginx --no-pager
    
    echo "✅ Nginx setup completed!"
else
    echo "❌ Nginx configuration has errors!"
    echo "Please check the configuration and try again."
    exit 1
fi
