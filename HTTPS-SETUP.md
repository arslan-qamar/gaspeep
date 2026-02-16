# HTTPS Development Setup Guide

This guide walks through setting up HTTPS locally with Nginx reverse proxy, Let's Encrypt wildcard certificates, and domain routing.

## Prerequisites

- Let's Encrypt wildcard certificate for `*.gaspeep.com` already generated
- Nginx installed (`sudo apt install nginx`)
- Frontend and Backend code cloned

## Architecture

```
                     ┌─────────────────────────────────┐
                     │   Browser                       │
                     │ https://dev.gaspeep.com         │
                     │ https://api.gaspeep.com         │
                     └────────────┬────────────────────┘
                                  │ :443 (HTTPS)
                     ┌────────────▼────────────────────┐
                     │   Nginx (Reverse Proxy)         │
                     │   - TLS Termination             │
                     │   - Domain Routing              │
                     └───┬────────────────────────┬────┘
                         │                        │
                    :80/:443 redirect        :80/:443 redirect
                         │                        │
        ┌────────────────▼──┐        ┌────────────▼──────────┐
        │   Frontend (3000)  │        │   Backend API (8080)  │
        │   React + Vite    │        │   Go + Gin            │
        └───────────────────┘        └───────────────────────┘
```

## Step-by-Step Setup

### 1. Generate Let's Encrypt Certificate (if not already done)

```bash
# Install Certbot with Cloudflare plugin
sudo apt update
sudo apt install certbot python3-certbot-dns-cloudflare

# Create Cloudflare API credentials file
sudo nano /etc/letsencrypt/cloudflare.ini
# Add: dns_cloudflare_api_token = YOUR_API_TOKEN

# Restrict permissions
sudo chmod 600 /etc/letsencrypt/cloudflare.ini

# Generate wildcard certificate
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d gaspeep.com \
  -d "*.gaspeep.com"

# Verify certificate
sudo openssl x509 -in /etc/letsencrypt/live/gaspeep.com/cert.pem -noout -text | grep -A2 "Subject Alternative Name"
```

### 2. Run Setup Script (One-Time)

```bash
make setup-https
```

This script will:
- Add `/etc/hosts` entries for `dev.gaspeep.com`, `api.gaspeep.com`, `gaspeep.com`
- Install and configure Nginx with the certificate
- Set correct file permissions
- Start/restart Nginx

### 3. Start Services

**Terminal 1 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000 (Nginx serves it as https://dev.gaspeep.com)
```

**Terminal 2 - Backend:**
```bash
cd backend
go build -o bin/api cmd/api/main.go
./bin/api
# Runs on http://localhost:8080 (Nginx serves it as https://api.gaspeep.com)
```

**Nginx** - Already started by `make setup-https`, runs in background:
```bash
# Check status
sudo systemctl status nginx

# View logs
sudo journalctl -u nginx -f

# Restart if needed
sudo systemctl restart nginx
```

### 4. Access Services

- Frontend: `https://dev.gaspeep.com`
- Backend Health: `https://api.gaspeep.com/health`
- Backend API: `https://api.gaspeep.com/api/...`

⚠️ **Browser Note**: Your browser will show `dev.gaspeep.com` in the URL bar, but it's actually served from localhost through Nginx.

## Configuration Files

### Nginx Configuration
**Location**: `/etc/nginx/nginx.conf` (system) or `./nginx.conf` (repo copy)

Handles:
- HTTP → HTTPS redirect (port 80 → 443)
- Domain-based routing (dev.gaspeep.com → frontend, api.gaspeep.com → backend)
- TLS certificate serving
- Security headers
- Proxy headers

### /etc/hosts
**Location**: `/etc/hosts`

```
127.0.0.1  dev.gaspeep.com
127.0.0.1  api.gaspeep.com
127.0.0.1  gaspeep.com
```

Maps domain names to localhost for local development.

## Common Tasks

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

### View Nginx Logs
```bash
sudo journalctl -u nginx -f  # Follow logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Remove Setup (Revert to HTTP)
```bash
# Stop Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Remove /etc/hosts entries
sudo nano /etc/hosts
# Delete the three gaspeep.com lines manually
```

### Verify Certificate
```bash
# Check expiration
sudo openssl x509 -in /etc/letsencrypt/live/gaspeep.com/cert.pem -noout -dates

# View full certificate
sudo openssl x509 -in /etc/letsencrypt/live/gaspeep.com/cert.pem -text -noout

# Verify domains covered
sudo openssl x509 -in /etc/letsencrypt/live/gaspeep.com/cert.pem -noout -text | grep -A1 "Subject Alternative Name"
```

## Troubleshooting

### Port 80 or 443 Already in Use
```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Kill the process (if safe)
sudo kill -9 <PID>

# Or change Nginx ports in nginx.conf
```

### Certificate Permission Denied
```bash
# Fix permissions
sudo usermod -a -G ssl-cert www-data
sudo chmod g+r /etc/letsencrypt/live/gaspeep.com/privkey.pem
sudo chmod g+r /etc/letsencrypt/archive/gaspeep.com/privkey1.pem

# Restart Nginx
sudo systemctl restart nginx
```

### Nginx Won't Start
```bash
# Test configuration
sudo nginx -t

# Check systemd status
sudo systemctl status nginx

# View detailed error
sudo journalctl -u nginx -n 50 -p err
```

### Can't Access https://dev.gaspeep.com
1. Verify `/etc/hosts` entries: `grep gaspeep.com /etc/hosts`
2. Verify Nginx is running: `sudo systemctl status nginx`
3. Test DNS resolution: `nslookup dev.gaspeep.com`
4. Test Nginx locally: `curl -k https://localhost`

### Browser Shows Certificate Warning
This is expected for the first visit. The certificate is valid but:
- Your browser may not recognize Let's Encrypt as a trusted CA in some cases
- The domain name shows correctly in the certificate

**It's safe to proceed** - the connection is encrypted and authenticated by Let's Encrypt.

### Frontend Can't Connect to Backend
1. Check Nginx logs: `sudo journalctl -u nginx -f`
2. Verify backend is running: `curl http://localhost:8080/health`
3. Check frontend VITE_API_URL environment variable
4. Verify CORS configuration in backend

## Docker Deployment

### With Nginx (HTTPS)
```bash
docker compose -f docker-compose.https.yml up --build
```

Services will be accessible at:
- `https://dev.gaspeep.com` (frontend)
- `https://api.gaspeep.com` (backend)

### Without Nginx (HTTP)
```bash
docker compose up --build
```

Services will be accessible at:
- `http://localhost:3001` (frontend)
- `http://localhost:8081` (backend)

## Security Notes

- ✅ All traffic is encrypted (TLS 1.2+)
- ✅ Let's Encrypt certificates are trusted by all major browsers
- ✅ HSTS header enforces HTTPS for future visits
- ✅ HTTP traffic is redirected to HTTPS
- ⚠️ Local setup uses `127.0.0.1` which is only accessible locally

## Next Steps

- Monitor certificate expiration: `make setup-https` will remind you
- Setup auto-renewal: Already configured when certificate was generated
- Deploy to production: Use the `docker-compose.https.yml` as reference

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt / Certbot Docs](https://certbot.eff.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
