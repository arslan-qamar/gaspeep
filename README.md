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

### Local Development

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
go mod download
cp .env.example .env
go run cmd/api/main.go
```

#### Database

```bash
createdb gas_peep
psql gas_peep -c "CREATE EXTENSION IF NOT EXISTS postgis;"
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
```env
VITE_API_URL=http://localhost:8080/api
```

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gas_peep
PORT=8080
JWT_SECRET=your-secret-key
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
