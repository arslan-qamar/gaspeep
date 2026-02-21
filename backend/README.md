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

The API will be available at `https://api.gaspeep.com`

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

### Service NSW v2 Sync

The backend can ingest Service NSW Fuel API v2 data via a manual trigger endpoint and stores:
- current prices in `fuel_prices`
- historical ingestion events in `price_submissions`
- station identity/state mapping in `stations`

Set these env vars in `backend/.env`:

```dotenv
SERVICE_NSW_SYNC_ENABLED=true
SERVICE_NSW_API_KEY=your_api_key
SERVICE_NSW_API_SECRET=your_api_secret

# Optional (defaults shown)
SERVICE_NSW_BASE_URL=https://api.onegov.nsw.gov.au
SERVICE_NSW_SYNC_STATES=NSW|TAS
SERVICE_NSW_INCREMENTAL_INTERVAL_MINUTES=60
SERVICE_NSW_FULL_SYNC_INTERVAL_HOURS=24
SERVICE_NSW_REQUEST_TIMEOUT_SECONDS=30
```

Notes:
- Sync is manual via API endpoint (it is not started automatically on app startup).
- Incremental sync uses `/FuelPriceCheck/v2/fuel/prices/new`.
- Full sync uses `/FuelPriceCheck/v2/fuel/prices` (and runs reference sync first).
- Reference sync uses `/FuelCheckRefData/v2/fuel/lovs`.

Trigger endpoint (authenticated):

```bash
curl -k -X POST "https://api.gaspeep.com/api/admin/service-nsw-sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <base64(SERVICE_NSW_API_KEY:SERVICE_NSW_API_SECRET)>" \
  -d '{"mode":"full"}'
```

Supported modes:
- `full`
- `incremental`

## Google OAuth Setup

1. Create OAuth credentials in Google Cloud Console:
    - Go to APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application.
    - Add an Authorized redirect URI matching `GOOGLE_OAUTH_REDIRECT` (example for local dev):
      - `https://api.gaspeep.com/api/auth/oauth/google/callback`
    - Copy the Client ID and Client Secret into your `backend/.env` as `GOOGLE_OAUTH_ID` and `GOOGLE_OAUTH_SECRET`.

2. Environment variables used for OAuth (set in `backend/.env`):
    - `GOOGLE_OAUTH_ID` — Google OAuth Client ID (required).
    - `GOOGLE_OAUTH_SECRET` — Google OAuth Client Secret (required; keep server-side only).
    - `GOOGLE_OAUTH_REDIRECT` — The redirect URI registered in Google Console (required).
    - `FRONTEND_OAUTH_SUCCESS_URL` — Frontend URL the backend will redirect to after exchanging tokens (optional; defaults to `${APP_BASE_URL}/auth/oauth/success`).

3. Test flow locally:
    - Start backend (`make -C backend dev`) and frontend (`npm run dev` in `frontend`).
    - Open the Sign In page and click “Sign in with Google” — a popup will open and, on success, the backend will set an HttpOnly session cookie and notify the opener.

## Google Vision OCR Setup

1. In Google Cloud Console:
    - Enable billing for your project.
    - Enable the `Cloud Vision API`.
    - Create an API key and restrict it to `Cloud Vision API` only.

2. Set environment variable in `backend/.env`:

```dotenv
GOOGLE_VISION_API_KEY=your_google_vision_api_key
```

3. Restart backend after updating env vars.

4. Test photo analysis endpoint:
    - Endpoint: `POST /api/price-submissions/analyze-photo`
    - Auth required (same auth middleware as other price submission routes).
    - Multipart field: `photo` (also accepts `image`).

Example `curl` test (cookie-based auth):

```bash
curl -k -X POST "https://api.gaspeep.com/api/price-submissions/analyze-photo" \
  -H "Cookie: auth_token=YOUR_AUTH_TOKEN" \
  -F "photo=@/absolute/path/to/price-board.jpg"
```

Successful response includes:
- `entries`: parsed fuel types and prices
- `ocrData`: raw OCR text extracted from the image

## Cookie configuration and production notes

The backend sets an HttpOnly `auth_token` cookie on successful sign-in (email/password or OAuth). Cookie attributes are configured as follows:

- `AUTH_COOKIE_DOMAIN` (optional) — set to your domain (e.g. `example.com`) to share cookies across subdomains; leave empty for host-only cookies.
- `AUTH_COOKIE_SECURE` (optional) — if set to `true`, the cookie will be marked `Secure`. If not set, the server uses `ENV=production` or TLS detection to enable `Secure` automatically in production.
- `SameSite` policy: when `ENV=production` the server uses `SameSite=Lax` for better CSRF protection; in development the server defaults to `SameSite=None` to support OAuth popups and cross-site redirects.

Recommendations:
- In production, set `AUTH_COOKIE_SECURE=true` and serve the app over HTTPS. Also set `AUTH_COOKIE_DOMAIN` if you need cookies shared across subdomains.
- Register production redirect URIs in Google Console using HTTPS (e.g. `https://yourdomain.com/api/auth/oauth/google/callback`).
- Consider using short-lived JWTs and refresh tokens if you require long-lived sessions.


## Local Email Testing (MailHog)

For local development you can capture outgoing emails with MailHog instead of sending them to real inboxes.

- Run MailHog via Docker:

```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

- MailHog SMTP listener: `localhost:1025`
- MailHog web UI: http://localhost:8025

- Example `.env` settings (update `backend/.env`):

```dotenv
# SMTP configuration for sending emails (e.g. password resets)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Gas Peep <no-reply@gaspeep.local>"
```

- Notes:
    - No real emails are sent when MailHog is used — messages are stored in MailHog and viewable in the web UI.
    - Use this in development only. For staging/production, configure a real SMTP provider or transactional email service.


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
