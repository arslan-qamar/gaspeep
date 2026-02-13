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
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
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

## API Documentation

API endpoints are documented in `backend/README.md`.

### Base URL
- Development: `http://localhost:8080/api`
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
