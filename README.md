# Gas Peep - Real-time Gas Price Tracking Platform

A full-stack application for tracking real-time gas prices, with user authentication, alerts, monetization features, and a station owner dashboard.

## Project Structure

```
gaspeep/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── shell/           # App layout and navigation
│   │   ├── sections/        # Feature modules
│   │   ├── services/        # API integrations
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and helpers
│   │   ├── styles/          # Global styles
│   │   └── __tests__/       # Test files
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── README.md
│
├── backend/                  # Go REST API
│   ├── cmd/
│   │   └── api/
│   │       └── main.go      # Entry point
│   ├── internal/
│   │   ├── db/              # Database connection
│   │   ├── models/          # Data models
│   │   ├── repository/      # Data access layer
│   │   ├── handler/         # HTTP handlers
│   │   ├── service/         # Business logic
│   │   ├── middleware/      # HTTP middleware
│   │   ├── auth/            # Authentication
│   │   ├── payment/         # Payment processing
│   │   └── migrations/      # Database migrations
│   ├── go.mod
│   ├── Dockerfile
│   └── README.md
│
├── product-plan/            # Product documentation and specs
│   ├── data-model/
│   ├── design-system/
│   ├── instructions/
│   ├── prompts/
│   └── sections/            # Feature specifications
│
├── docker compose.yml       # Local development stack
└── README.md               # This file
```

## Quick Start

### Using Docker Compose

1. Clone the repository:
```bash
git clone <repo-url>
cd gaspeep
```

2. Start the stack:
```bash
docker compose up --build
```

3. Access the applications:
   - Frontend: https://dev.gaspeep.com
   - Backend API: https://api.gaspeep.com
   - Database: localhost:5432

### Local Development (Without Docker)

#### Prerequisites

- PostgreSQL 14+ with PostGIS extension
- Go 1.21+
- Node.js 18+
- npm or yarn

#### Step 1: Database Setup

```bash
# Install PostgreSQL and PostGIS (Ubuntu/Debian)
sudo apt update
sudo apt install -y postgresql postgresql-contrib postgis postgresql-16-postgis-3

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and enable PostGIS
sudo -u postgres psql -c "CREATE DATABASE gas_peep;"
sudo -u postgres psql -d gas_peep -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Set postgres user password (must match .env file)
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

#### Step 2: Run Database Migrations

```bash
# Run migrations in order
cd backend/internal/migrations
for file in $(ls *.up.sql | sort); do
  sudo -u postgres psql -d gas_peep -f "$file"
done

# Record migrations in tracking table
sudo -u postgres psql -d gas_peep << EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (migration) VALUES
('001_create_users_table.up.sql'),
('002_create_stations_table.up.sql'),
('003_create_fuel_types_table.up.sql'),
('004_create_fuel_prices_table.up.sql'),
('005_create_price_submissions_table.up.sql'),
('006_create_alerts_table.up.sql'),
('007_create_notifications_table.up.sql'),
('008_create_station_owners_table.up.sql'),
('009_create_broadcasts_table.up.sql')
ON CONFLICT (migration) DO NOTHING;
EOF
```

#### Step 3: Seed Database with Test Data

```bash
# Load seed data (15 stations in Sydney area, 11 fuel types, 58 prices)
cd ../..  # back to backend/
cat seed_data.sql | sudo -u postgres psql -d gas_peep
```

#### Step 4: Backend Setup

```bash
# Install dependencies and build
cd backend
go mod download
cp .env.example .env

# Edit .env if needed (default values work for local development)
# Build the API
go build -o bin/api cmd/api/main.go

# Run the backend
./bin/api
# Backend will start on http://0.0.0.0:8080
```

#### Step 5: Frontend Setup

```bash
cd frontend
npm install

# For localhost access only:
npm run dev

# For network access (accessible from other devices):
# Set BACKEND_URL to your machine's IP address
BACKEND_URL=http://192.168.1.91:8080 npm run dev

# Frontend will start on http://0.0.0.0:3000
# Accessible at http://192.168.1.91:3000 from other devices
```

#### Network Access

The frontend and backend are configured to be accessible from other devices on your network:

- **Frontend**: `http://<your-ip>:3000` (e.g., `http://192.168.1.91:3000`)
- **Backend**: `http://<your-ip>:8080` (e.g., `http://192.168.1.91:8080`)

**Find Your IP Address:**
```bash
# Linux/Mac
hostname -I | awk '{print $1}'

# Or check all network interfaces
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Start Servers for Network Access:**
```bash
# Terminal 1: Backend (binds to 0.0.0.0 by default)
cd backend
./bin/api

# Terminal 2: Frontend (replace IP with your actual IP)
cd frontend
BACKEND_URL=http://192.168.1.91:8080 npm run dev
```

#### Managing Development Servers

**View Server Logs:**
```bash
# Backend logs (if running in foreground, logs appear in terminal)
# Frontend logs (if running in foreground, logs appear in terminal)
```

**Stop Servers:**
```bash
# Press Ctrl+C in the terminal where the server is running

# Or find and kill processes
ps aux | grep -E "api|vite"
pkill -f "./bin/api"
pkill -f "vite"
```

**Rebuild After Changes:**
```bash
# Backend (after Go code changes)
cd backend
go build -o bin/api cmd/api/main.go

# Frontend (hot-reload is automatic with Vite)
# Just save your files and Vite will rebuild
```

## Features

### Phase 1: Foundation & Database Setup ✓
- PostgreSQL database with PostGIS for geographic queries
- Go backend scaffold with Gin framework
- Database schema with 8 tables
- Environment configuration

### Phase 2: Application Shell & Navigation ✓
- Header with logo and navigation
- Desktop navigation menu
- Mobile bottom navigation
- User menu with authentication status

### Phase 3: Map & Station Browsing
- Interactive map view of gas stations
- Station details and amenities
- Price history charts
- Station filtering by fuel type

### Phase 4: Price Submission System
- Submit gas prices with multiple methods
- Photo and voice recording support
- OCR for receipt parsing
- Moderation workflow

### Phase 5: User Authentication & Tiers
- Email/password and OAuth signup/signin
- Free and Premium tier system
- User profile management
- Tier-based feature access

### Phase 6: Alerts & Notifications
- Price alerts by fuel type and location
- Real-time notifications
- Alert management dashboard
- Delivery status tracking

### Phase 7: Station Owner Dashboard
- Business registration and verification
- Broadcast messages to nearby users
- Analytics and engagement metrics
- Price update management

### Phase 8: Monetization & Premium Features
- Stripe payment integration
- Premium subscription tier
- Ad network integration for free users
- Analytics dashboard

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Zustand** - State management
- **Leaflet** - Map rendering

### Backend
- **Go 1.21** - Server runtime
- **Gin** - Web framework
- **PostgreSQL 14+** - Database
- **PostGIS** - Geographic queries
- **JWT** - Authentication
- **Stripe** - Payment processing

### Infrastructure
- **Docker** - Containerization
- **docker compose** - Local orchestration
- **Nginx** - Reverse proxy and SPA routing

## Development Workflow

1. **Read product specifications**: Check `product-plan/instructions/`
2. **Create feature branch**: `git checkout -b feature/phase-3-map`
3. **Implement changes**: Follow the spec and test requirements
4. **Test locally**: `npm run test` (frontend) or `go test ./...` (backend)
5. **Submit pull request**: Include testing evidence

## Environment Variables

### Frontend (.env.local)

The frontend uses Vite's proxy to forward `/api` requests to the backend. You can configure this in two ways:

**Option 1: Environment Variable (Recommended)**
```bash
# Set when starting the dev server
BACKEND_URL=http://192.168.1.91:8080 npm run dev
```

**Option 2: .env.local File**
```env
# For direct API calls (bypasses Vite proxy)
VITE_API_URL=http://192.168.1.91:8080/api
```

Note: Replace `192.168.1.91` with your actual machine IP address.

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gas_peep
PORT=8080
JWT_SECRET=your-super-secret-key-change-in-production

# Optional OAuth and external service credentials
GOOGLE_OAUTH_ID=
GOOGLE_OAUTH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
```

## SSL/TLS Certificate Setup

### Development: Using Self-Signed Certificates

For local development, self-signed certificates are already included in `backend/certs/`:

```bash
# Current development certificates
backend/certs/dev.gaspeep.com-cert.pem
backend/certs/dev.gaspeep.com-key.pem
```

To run the backend with TLS in development:

```bash
cd backend
export TLS_CERT=./certs/dev.gaspeep.com-cert.pem
export TLS_KEY=./certs/dev.gaspeep.com-key.pem
./bin/api
```

The backend will start on `https://api.gaspeep.com` (browser will show certificate warning).

### Production: Let's Encrypt Wildcard Certificate with Cloudflare

Generate production-ready wildcard certificates that cover all subdomains (api.gaspeep.com, dev.gaspeep.com, staging.gaspeep.com, etc.).

#### Prerequisites

1. **Domain registered and DNS managed by Cloudflare:**
   - Register your domain (e.g., `gaspeep.com`)
   - Point nameservers to Cloudflare

2. **Cloudflare API Token:**
   - Log in to Cloudflare → Account → API Tokens
   - Create token with "Zone:DNS:Edit" permissions
   - Copy the token

3. **Install Certbot with Cloudflare plugin:**

```bash
sudo apt update
sudo apt install certbot python3-certbot-dns-cloudflare
```

#### Step 1: Create Cloudflare Credentials File

```bash
# Create credentials file
sudo nano /etc/letsencrypt/cloudflare.ini
```

Add the following content (replace with your actual token):

```ini
dns_cloudflare_api_token = your-cloudflare-api-token-here
```

Restrict permissions:

```bash
sudo chmod 600 /etc/letsencrypt/cloudflare.ini
```

#### Step 2: Generate Wildcard Certificate

A wildcard certificate `*.gaspeep.com` covers all subdomains:

```bash
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d gaspeep.com \
  -d "*.gaspeep.com"
```

Certificates will be saved to: `/etc/letsencrypt/live/gaspeep.com/`

#### Step 3: Configure Backend Environment Variables

Update your `.env` file:

```bash
# .env
TLS_CERT=/etc/letsencrypt/live/gaspeep.com/fullchain.pem
TLS_KEY=/etc/letsencrypt/live/gaspeep.com/privkey.pem
```

Ensure the backend user has read permissions:

```bash
# Give backend process access to certificates
sudo usermod -a -G ssl-cert ubuntu
sudo chmod g+r /etc/letsencrypt/live/gaspeep.com/privkey.pem
```

#### Step 4: Start Backend with TLS

```bash
cd backend
./bin/api
# Backend will start on https://api.gaspeep.com
```

#### Step 5: Setup Automatic Certificate Renewal

Let's Encrypt certificates expire after 90 days. Certbot automatically renews them 30 days before expiration:

```bash
# Test renewal process (dry-run)
sudo certbot renew --dry-run

# Enable automatic renewal via systemd timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify renewal is scheduled
sudo systemctl status certbot.timer
```

#### Docker Deployment

For Docker deployments, use volume mounts to persist and access certificates:

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "8081:8080"
    environment:
      TLS_CERT: /etc/letsencrypt/live/gaspeep.com/fullchain.pem
      TLS_KEY: /etc/letsencrypt/live/gaspeep.com/privkey.pem
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro  # Mount certificates as read-only
```

#### Troubleshooting

**Certificate generation fails**
```bash
# Check DNS is propagated
nslookup gaspeep.com
dig gaspeep.com

# Verify Cloudflare is authoritative
dig gaspeep.com @1.1.1.1

# Test with verbose output
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d gaspeep.com \
  -d "*.gaspeep.com" \
  -v
```

**Renewal fails**
```bash
# Check renewal logs
sudo journalctl -u certbot.timer -n 50

# Manually trigger renewal
sudo certbot renew -v

# Ensure permissions are correct
sudo chmod g+r /etc/letsencrypt/live/gaspeep.com/privkey.pem
```

**Certificate not trusted in browser**
- Ensure you're using the full chain: `fullchain.pem` (not `cert.pem`)
- Clear browser cache and restart
- Check certificate: `openssl x509 -in /etc/letsencrypt/live/gaspeep.com/cert.pem -text -noout`

#### Verify Certificate Details

```bash
# View certificate information
sudo openssl x509 -in /etc/letsencrypt/live/gaspeep.com/cert.pem -text -noout

# Check certificate expiration
sudo openssl x509 -in /etc/letsencrypt/live/gaspeep.com/cert.pem -noout -dates

# Verify it covers all domains
sudo openssl x509 -in /etc/letsencrypt/live/gaspeep.com/cert.pem -noout -text | grep -A1 "Subject Alternative Name"
```

## HTTPS Development Setup with Nginx (This is Preferred over Docker based)

Once you have Let's Encrypt certificates generated, you can run the full stack locally with HTTPS and proper domain routing.

### Quick Setup

```bash
# One-time setup (adds /etc/hosts entries, configures Nginx)
make setup-https

# Then start the services (in separate terminals)
cd frontend
npm install
npm run dev

cd backend
go build -o bin/api cmd/api/main.go
./bin/api
```

### What Gets Set Up

The `setup-https` script configures:

1. **`/etc/hosts` entries** - Maps domains to localhost:
   ```
   127.0.0.1  dev.gaspeep.com
   127.0.0.1  api.gaspeep.com
   127.0.0.1  gaspeep.com
   ```

2. **Nginx reverse proxy** - Handles HTTPS and routes by domain:
   - `https://dev.gaspeep.com` → Frontend 
   - `https://api.gaspeep.com` → Backend 

3. **Certificate permissions** - Allows Nginx to read Let's Encrypt certificates

### Access Your Services

After setup, visit:

- **Frontend**: `https://dev.gaspeep.com`
- **Backend Health**: `https://api.gaspeep.com/health`
- **API Base**: `https://api.gaspeep.com/api`

### Docker Compose with Nginx

To run the full stack in Docker with Nginx:

```bash
# With Nginx and HTTPS (requires Let's Encrypt certificates)
docker compose -f docker-compose.https.yml up --build

# Or use the Makefile
make docker-https
```

Services will be accessible at:
- Frontend: `https://dev.gaspeep.com`
- Backend: `https://api.gaspeep.com`


### Makefile Commands

```bash
make help              # Show all available commands
make setup-https       # Setup Nginx and /etc/hosts for HTTPS dev
make dev              # Run backend with hot-reload
make docker-https     # Start full stack with Nginx (HTTPS)
make docker-dev       # Start full stack without Nginx (HTTP)
make down             # Stop Docker containers
make logs             # View Docker logs
```

### Troubleshooting HTTPS Setup

**Port 80 or 443 already in use:**
```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop the process or change Nginx ports in nginx.conf
```

**Certificate permission denied:**
```bash
# Re-run the setup script
make setup-https

# Or manually fix permissions
sudo chmod g+r /etc/letsencrypt/live/gaspeep.com/privkey.pem
```

**Nginx not starting:**
```bash
# Check Nginx configuration
sudo nginx -t

# View Nginx errors
sudo systemctl status nginx
sudo journalctl -u nginx -n 20
```

**Can't access https://dev.gaspeep.com:**
```bash
# Verify /etc/hosts entries
grep gaspeep.com /etc/hosts

# Verify Nginx is running
sudo systemctl status nginx

# Test Nginx locally
curl -k https://localhost
```

## API Documentation

API endpoints are documented in `backend/README.md`.

### Base URL
- Development: `https://api.gaspeep.com/api`
- Production: `https://api.gaspeep.com/api`

### Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Database Schema

See `product-plan/data-model/data-model.md` for full schema documentation.

Key tables:
- `users` - User accounts
- `stations` - Gas station locations
- `fuel_types` - Available fuel types
- `fuel_prices` - Current prices per fuel type
- `price_submissions` - User price reports
- `alerts` - Price alerts
- `notifications` - Alert notifications
- `station_owners` - Business accounts
- `broadcasts` - Promotional messages

## Testing

### Frontend Unit Tests
```bash
cd frontend
npm run test
npm run test:coverage
```

### Backend Unit Tests
```bash
cd backend
go test ./...
```

### Integration Tests
Tests run on both frontend and backend for API interactions.

## Deployment

### Production Build

Frontend:
```bash
cd frontend
npm run build
```

Backend:
```bash
cd backend
go build -o api cmd/api/main.go
```

### Docker Deployment

```bash
docker compose -f docker compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

See `product-plan/` for detailed specifications and requirements.

## License

MIT

## Support

For issues and questions, please use the GitHub issues tracker.
