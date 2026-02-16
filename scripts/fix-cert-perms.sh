#!/usr/bin/env bash
# Quick script to fix Let's Encrypt certificate permissions
# Run this if you get "permission denied" errors when running the backend

set -euo pipefail

echo "Fixing Let's Encrypt certificate permissions..."

# Make directories readable
sudo chmod 755 /etc/letsencrypt || true
sudo chmod 755 /etc/letsencrypt/live || true
sudo chmod 755 /etc/letsencrypt/archive || true
sudo chmod 755 /etc/letsencrypt/archive/gaspeep.com || true
sudo chmod 755 /etc/letsencrypt/live/gaspeep.com || true

# Make certificate files readable by user and www-data
sudo chmod 644 /etc/letsencrypt/archive/gaspeep.com/privkey*.pem || true
sudo chmod 644 /etc/letsencrypt/archive/gaspeep.com/cert*.pem || true
sudo chmod 644 /etc/letsencrypt/archive/gaspeep.com/fullchain*.pem || true

# Also allow www-data (for Nginx)
sudo usermod -a -G ssl-cert www-data 2>/dev/null || true

echo "✓ Certificate permissions fixed!"
echo ""
echo "You can now run:"
echo "  cd backend && ./bin/api"
