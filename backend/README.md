# Gas Peep Backend API

Go REST API for the Gas Peep real-time gas price tracking platform.

## Getting Started

### Prerequisites

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

## Debugging (Delve)

You can debug the backend with Delve (dlv). Two convenient flows are provided:

- Start Delve headless (builds and serves on :2345) and attach from VS Code:

    - Install Delve:

        ```bash
        make -C backend install-dlv
        ```

    - Start headless Delve (from repo root):

        ```bash
        make -C backend dlv-headless
        ```

    - In VS Code: Run the `Attach to Delve (Remote :2345)` configuration in the Run view.

- Attach to a running process (useful when using `air`):

    - Start the dev watcher (builds and restarts binary):

        ```bash
        make -C backend dev
        ```

    - In VS Code: Run `Attach to Running Backend (Pick Process)` and select the process for `bin/api`.

- Launch and debug directly from VS Code (no separate dlv install required):

    - Use the `Launch Backend (dlv debug)` configuration in the Run view. This launches the backend under the debugger.

Notes:

- Ensure `$GOPATH/bin` or `$GOBIN` is on your `PATH` so installed tools (`air`, `dlv`) are found.
- If you prefer a task, use `Tasks: Run Task` → `Backend: Start Delve Headless` to start the headless server from VS Code.
