#!/usr/bin/env bash
set -euo pipefail

# Setup script for HTTPS development with Nginx, Let's Encrypt, and /etc/hosts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "================================"
echo "Gas Peep HTTPS Development Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check for required tools
echo "Step 1: Checking prerequisites..."
missing_tools=()

if ! command -v nginx &> /dev/null; then
    missing_tools+=("nginx")
fi

if ! command -v sudo &> /dev/null; then
    missing_tools+=("sudo")
fi

if [ ${#missing_tools[@]} -gt 0 ]; then
    echo -e "${YELLOW}Missing tools: ${missing_tools[*]}${NC}"
    echo "Installing missing tools..."
    sudo apt update
    sudo apt install -y nginx
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Step 2: Setup /etc/hosts entries
echo "Step 2: Setting up /etc/hosts entries..."

HOST_ENTRY_1="127.0.0.1       dev.gaspeep.com"
HOST_ENTRY_2="127.0.0.1       api.gaspeep.com"
HOST_ENTRY_3="127.0.0.1       gaspeep.com"

# Check if entries already exist
if grep -q "dev.gaspeep.com" /etc/hosts; then
    echo "✓ dev.gaspeep.com already in /etc/hosts"
else
    echo "Adding dev.gaspeep.com to /etc/hosts..."
    echo "$HOST_ENTRY_1" | sudo tee -a /etc/hosts > /dev/null
fi

if grep -q "api.gaspeep.com" /etc/hosts; then
    echo "✓ api.gaspeep.com already in /etc/hosts"
else
    echo "Adding api.gaspeep.com to /etc/hosts..."
    echo "$HOST_ENTRY_2" | sudo tee -a /etc/hosts > /dev/null
fi

if grep -q "^127.0.0.1.*gaspeep.com" /etc/hosts | grep -v "dev.gaspeep.com" | grep -v "api.gaspeep.com"; then
    echo "✓ gaspeep.com already in /etc/hosts"
else
    echo "Adding gaspeep.com to /etc/hosts..."
    echo "$HOST_ENTRY_3" | sudo tee -a /etc/hosts > /dev/null
fi

echo -e "${GREEN}✓ /etc/hosts setup complete${NC}"
echo ""

# Step 3: Setup Nginx configuration
echo "Step 3: Setting up Nginx configuration..."

# Check if Let's Encrypt certificates exist
if [ ! -f "/etc/letsencrypt/live/gaspeep.com/fullchain.pem" ]; then
    echo -e "${RED}✗ Let's Encrypt certificates not found at /etc/letsencrypt/live/gaspeep.com/${NC}"
    echo "Please run the certificate generation steps from the README first:"
    echo "  1. Install Certbot: sudo apt install certbot python3-certbot-dns-cloudflare"
    echo "  2. Create Cloudflare credentials: sudo nano /etc/letsencrypt/cloudflare.ini"
    echo "  3. Generate certificates: sudo certbot certonly --dns-cloudflare ..."
    exit 1
fi

echo "✓ Let's Encrypt certificates found"

# Copy nginx config
echo "Setting up Nginx configuration..."
sudo cp "$PROJECT_ROOT/nginx.conf" /etc/nginx/nginx.conf
echo "✓ Nginx config installed"

# Test nginx config
echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    exit 1
fi
echo ""

# Step 4: Setup certificate permissions
echo "Step 4: Setting up certificate permissions..."

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

echo -e "${GREEN}✓ Certificate permissions set${NC}"
echo ""

# Step 5: Enable and start Nginx
echo "Step 5: Starting Nginx..."

sudo systemctl enable nginx
sudo systemctl restart nginx

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Failed to start Nginx${NC}"
    sudo systemctl status nginx
    exit 1
fi
echo ""

# Step 6: Verify setup
echo "Step 6: Verifying setup..."
echo ""

echo "Checking /etc/hosts entries:"
grep -E "(dev\.gaspeep\.com|api\.gaspeep\.com)" /etc/hosts | sed 's/^/  /'

echo ""
echo "Checking Nginx server blocks:"
sudo nginx -T 2>&1 | grep "server_name" | sed 's/^/  /'

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ HTTPS Development Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Start the frontend: cd frontend && npm run dev"
echo "  2. Start the backend:  cd backend && ./bin/api"
echo "  3. Visit: https://dev.gaspeep.com (frontend)"
echo "  4. API:   https://api.gaspeep.com/health (backend)"
echo ""
echo "⚠️  Browser will show 'dev.gaspeep.com' in the address bar but it's served by Nginx locally"
echo ""
