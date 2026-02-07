# Gas Peep Backend API

Go REST API for the Gas Peep real-time gas price tracking platform.

## Getting Started

### Prerequisites

- Go 1.21+
- PostgreSQL 14+ with PostGIS extension
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
go mod download
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Set up the database:

```bash
createdb gas_peep
psql gas_peep -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

5. Run migrations (to be implemented)

### Development

```bash
go run cmd/api/main.go
```

The API will be available at `http://localhost:8080`

### Building

```bash
go build -o bin/api cmd/api/main.go
./bin/api
```

### Testing

```bash
go test ./...
```

### Code Quality

```bash
go fmt ./...
go vet ./...
golangci-lint run
```

## Project Structure

```
cmd/
└── api/
    └── main.go           # Entry point

internal/
├── db/                   # Database connection
├── models/               # Data models
├── repository/           # Data access layer
├── handler/              # HTTP handlers
├── service/              # Business logic
├── middleware/           # HTTP middleware
├── auth/                 # Authentication
├── payment/              # Payment processing
└── migrations/           # Database migrations
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Sign up new user
- `POST /api/auth/signin` - Sign in user
- `GET /api/auth/me` - Get current user (requires auth)

### Health

- `GET /health` - Health check

## Environment Variables

See `.env.example` for all available configuration options.

## Database

Uses PostgreSQL with PostGIS extension for geographic queries.

### Creating a Migration

```bash
migrate create -ext sql -dir internal/migrations -seq create_users_table
```

## Docker

Build and run with Docker:

```bash
docker build -t gas-peep-api .
docker run -p 8080:8080 --env-file .env gas-peep-api
```

Or use docker compose:

```bash
docker compose up
```

## Contributing

See main repository for contributing guidelines.

## License

MIT
