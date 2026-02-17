# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gas Peep is a real-time gas price tracking platform. It's a monorepo with a Go backend API and a React/TypeScript frontend.

## Build & Run Commands

### Full stack (Docker)
```bash
docker compose up --build
# Frontend: https://localhost:3001, Backend: https://localhost:8081, DB: localhost:5433
```

### Backend (local)
```bash
cd backend
go build -o bin/api cmd/api/main.go
./bin/api                          # starts on :8080
```

Hot-reload with air:
```bash
cd backend
make dev                           # runs ./scripts/dev.sh (requires air)
make install-air                   # install air watcher
```

### Frontend (local)
```bash
cd frontend
npm install
npm run dev                        # starts on https://dev.gaspeep.com
BACKEND_URL=https://api.gaspeep.com npm run dev  # custom backend target
```

### Tests
```bash
# Frontend
cd frontend && npm test                       # run all tests (Jest)
cd frontend && npx jest path/to/file.test.ts  # single test file
cd frontend && npm run test:coverage          # coverage report

# Backend
cd backend && go test ./...                   # all tests
cd backend && go test ./internal/handler/...  # single package
```

### Lint & Build
```bash
cd frontend && npm run lint        # ESLint
cd frontend && npm run build       # tsc + vite build
cd backend && make build           # go build ./...
```

## Architecture

### Backend (`backend/`)
- **Entry point**: `cmd/api/main.go` — wires up all dependencies and routes
- **Framework**: Gin (HTTP), lib/pq (PostgreSQL driver)
- **Layered architecture**: handler → service → repository → database
  - `internal/handler/` — HTTP request handlers (parse request, call service, return JSON)
  - `internal/service/` — business logic
  - `internal/repository/` — database queries (all use `database/sql` directly, no ORM)
  - `internal/models/` — Go structs for domain objects
- **Auth**: JWT (HS256) via `internal/auth/`, middleware in `internal/middleware/`
- **Migrations**: SQL files in `internal/migrations/`, auto-run on startup via `db.MigrationRunner`
- **Database**: PostgreSQL with PostGIS for geographic queries
- **API prefix**: All routes under `/api/` (e.g., `/api/auth/signup`, `/api/stations`)

### Frontend (`frontend/`)
- **Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **State**: Zustand stores, React Query for server state
- **Routing**: React Router v6 in `src/lib/router.tsx`
- **Path alias**: `@/` maps to `src/`
- **API client**: Axios instance in `src/lib/api.ts` with JWT interceptor (token in localStorage)
- **Structure**:
  - `src/shell/` — app layout, header, navigation (desktop + mobile bottom nav)
  - `src/sections/` — feature modules organized by product area (map-and-station-browsing, price-submission-system, alerts-and-notifications, user-authentication-and-tiers, station-owner-dashboard)
  - `src/services/` — API service wrappers
  - `src/hooks/` — custom hooks (e.g., `useAuth`)
  - `src/lib/` — shared utilities, routing, API client, ProtectedRoute
  - `src/__tests__/` — test files
- **Testing**: Jest + React Testing Library + jsdom

### Dev Environment
- Vite proxies `/api` requests to the backend (configured in `vite.config.ts`)
- TLS enabled in dev via self-signed certs in `frontend/certs/` and `backend/certs/`
- Docker Compose maps: frontend 3001→3000, backend 8081→8080, postgres 5433→5432

### Key Environment Variables
- Backend: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `JWT_SECRET`, `TLS_CERT`, `TLS_KEY`
- Frontend: `VITE_API_URL` (direct API base), `BACKEND_URL` (Vite proxy target)

## Phase 3 Implementation - Station Owner Dashboard

### Current Status (Feb 17, 2026)
- **Working**: 6/8 endpoints (75% coverage)
- **Issue**: POST `/broadcasts` and POST `/broadcasts/draft` returning 500 FK constraint violations

### Key Changes Made
1. **Service Layer Refactoring** (`internal/service/broadcast_service.go`)
   - Modified `CreateBroadcast()` to accept `userID` instead of `stationOwnerID`
   - Service now performs user→station_owner lookup via `stationOwnerRepo.GetByUserID()`
   - Added comprehensive logging at each step for debugging

2. **Error Handling Improvements** (`internal/service/station_owner_service.go`)
   - `GetProfile()` returns graceful default response instead of 500 error
   - Prevents crashes when station owner profile missing

3. **API Response Enhancement** (`internal/handler/broadcast_handler.go`)
   - Broadcast creation endpoints now return error details for debugging
   - Format: `{"error": "user message", "details": "technical error"}`

4. **Dependency Injection** (`cmd/api/main.go`)
   - `broadcastService` now receives `stationOwnerRepo` for lookups

### Testing Approach
- **Local Testing**: Use `cd backend && ./bin/api` to run without Docker
- **No Docker for API tests**: Test against local server directly on `:8080`
- **Log Monitoring**: Check stdout/stderr for `[CreateBroadcast]` log messages
- **Database**: Use local PostgreSQL connection for manual verification

### Known Test Data
```sql
-- Station owners created for testing:
INSERT INTO station_owners (id, user_id, business_name, verification_status, created_at)
VALUES
  ('2726d50d-423b-4c73-a850-62f798556bb0', '9f8b4ad7-3ce3-4387-8503-8b33ecba8113', 'Test Station 1', 'verified', NOW()),
  ('4b928b78-bbf0-413d-aad8-49fd859dcf24', '56fa2f35-893f-40ec-b9a7-ca68538b2cb3', 'Test Station 2', 'verified', NOW()),
  ('9ca3dafe-c2e9-4e81-8f9d-444f84f6af79', 'cac6e8a8-9151-41bd-bcd6-dc0686b1a647', 'Test Station 3', 'verified', NOW());
```

### Debugging Strategy
1. Run backend locally: `cd backend && go build -o bin/api cmd/api/main.go && ./bin/api`
2. Test endpoints directly against `:8080`
3. Monitor logs for `[CreateBroadcast]` messages to trace execution flow
4. Verify FK constraint by checking actual station_owner ID in database
5. Confirm user→owner lookup is returning correct ID before DB insert
