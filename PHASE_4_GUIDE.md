# Phase 4: Integration Testing - Quick Start Guide (Local Development)

## Quick Commands

### 1. Start the Development Environment (Local)

**Terminal 1: Start the Backend**
```bash
cd /home/ubuntu/gaspeep/backend
go build -o bin/api cmd/api/main.go
./bin/api
# Backend starts on http://localhost:8080
```

**Terminal 2: Start the Frontend** (optional for API testing)
```bash
cd /home/ubuntu/gaspeep/frontend
npm install
BACKEND_URL=http://localhost:8080 npm run dev
# Frontend starts on http://localhost:3000
```

**Prerequisites**:
- PostgreSQL running locally (see Database Setup below)
- Go 1.19+ installed
- Node.js 18+ installed

### 2. Database Setup

**Ensure PostgreSQL is running**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql
```

**Create the database** (if not already created):
```bash
sudo -u postgres psql -c "CREATE DATABASE gaspeep;"
```

**Verify database connection** (backend migrations auto-run on startup):
```bash
psql -U postgres -d gaspeep -c "\dt"
# Should show all tables after backend starts
```

### 3. Verify Everything Works

```bash
# Test backend is running
curl http://localhost:8080/health

# Check database tables (migrations auto-applied)
psql -U postgres -d gaspeep -c "\dt"

# Test a protected endpoint (returns 401 if no token, but confirms backend is up)
curl http://localhost:8080/api/station-owners/profile
```

### 4. Run Test Suites

```bash
# Backend tests (all)
cd /home/ubuntu/gaspeep/backend && go test ./... -v

# Backend tests (specific package)
cd /home/ubuntu/gaspeep/backend && go test ./internal/handler -v -run TestGetProfile

# Frontend tests
cd /home/ubuntu/gaspeep/frontend && npm test

# Frontend tests (specific file)
cd /home/ubuntu/gaspeep/frontend && npx jest src/sections/station-owner-dashboard/__tests__/CreateBroadcastScreen.test.tsx
```

### 5. Manual API Testing (Local)

```bash
# First, get a JWT token from the auth endpoint
# Replace with actual test credentials
export TOKEN="your_jwt_token"

# Test the main endpoints against localhost:8080
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/station-owners/profile
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/station-owners/stats
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/broadcasts

# Create a broadcast
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station_101",
    "title": "Test Broadcast",
    "message": "Test message",
    "targetRadiusKm": 10,
    "startDate": "2026-02-18T00:00:00Z",
    "endDate": "2026-02-20T23:59:59Z",
    "targetFuelTypes": "fuel_diesel"
  }' \
  http://localhost:8080/api/broadcasts
```

## Testing Checklist (Phase 4 - Local Development)

### Current Status
**Date**: 2026-02-17
- **Setup Phase**: ✓ COMPLETE (5/5)
- **Unit Testing Phase**: ⚠ MOSTLY COMPLETE (2.5/3 - frontend import.meta issue needs fixing)
- **Integration Testing Phase**: 🔄 PENDING (needs manual API endpoint testing)

### Setup Phase
- [x] PostgreSQL service running (`sudo systemctl status postgresql`)
- [x] Database created (gas_peep with 15 tables)
- [x] Backend compiled and running (`cd backend && go build -o bin/api cmd/api/main.go && ./bin/api`)
- [x] Migrations auto-applied (all migrations completed successfully)
- [x] Database tables created (`psql -U postgres -d gas_peep -c "\dt"` - 15 tables verified)

### Unit Testing Phase
- [x] Backend tests pass (8/8 tests passed: `cd backend && go test ./...`)
- [~] Frontend tests mostly pass (283/284 tests passed; MapPage.spec.tsx has import.meta issue)
  - **Known Issue**: Jest can't parse `import.meta.env` in src/lib/api.ts
  - **Fix needed**: Update api.ts to handle Node.js environment or mock import.meta in Jest config
- [x] Handler integration tests pass (8/8 passed: `cd backend && go test ./internal/handler -v`)

### Integration Testing Phase

#### Database Connectivity
- [x] PostgreSQL is accessible at localhost:5432 (verified)
- [x] Migrations created all tables successfully (15 tables verified)
- [ ] Foreign key constraints verified in schema
- [x] Can query all tables from psql CLI (verified)

#### API Endpoint Testing (against localhost:8080)
- [x] GET /api/station-owners/profile → 200 OK ✓
- [x] GET /api/station-owners/stats → 200 OK ✓
- [x] GET /api/station-owners/stations → 200 OK ✓
- [x] GET /api/station-owners/fuel-prices → 200 OK ✓
- [x] GET /api/broadcasts → 200 OK (returns array) ✓
- [x] POST /api/broadcasts → 201 Created ✓
- [x] GET /api/broadcasts/:id → 200 OK ✓
- [x] POST /api/broadcasts/draft → 201 Created ✓
- [x] POST /api/broadcasts/:id/send → 200 OK ✓
- [x] POST /api/broadcasts/:id/schedule → 200 OK ✓
- [x] Error handling (401 for missing token, 400 for invalid input) ✓

#### Data Integrity Testing
- [ ] User cannot access other user's stations
- [ ] User cannot access other user's broadcasts
- [ ] Deleting broadcast succeeds only for draft/cancelled status
- [ ] Status transitions work correctly (draft → active → completed)

#### Performance Testing (local)
- [ ] GetFuelPricesForOwner() < 500ms
- [ ] SearchAvailableStations() < 1s
- [ ] GetBroadcasts() < 200ms

## File Reference

### For Testing
- **Test Plans**: `TESTING_CHECKLIST.md`
- **API Reference**: `API_ENDPOINTS.md`
- **Implementation Details**: `IMPLEMENTATION_STATUS.md`

### For Development
- **Service Layer**: `backend/internal/service/*.go`
- **Repository Layer**: `backend/internal/repository/*.go`
- **Migrations**: `backend/internal/migrations/011-014_*.sql`
- **Tests**: `backend/internal/handler/*_test.go`

### For Frontend Integration
- **Service Module**: `frontend/src/services/stationOwnerService.ts`
- **Type Definitions**: `frontend/src/sections/station-owner-dashboard/types.ts`
- **Components**: `frontend/src/sections/station-owner-dashboard/*.tsx`

## Common Issues & Fixes (Local Development)

### Issue: "Port 8080 already in use"
```bash
# Find and kill the process using port 8080
lsof -ti:8080 | xargs kill -9

# Or find what's using the port
lsof -i :8080

# Then restart the backend
cd /home/ubuntu/gaspeep/backend
go build -o bin/api cmd/api/main.go
./bin/api
```

### Issue: "Database connection refused" or "connection to localhost:5432 failed"
```bash
# Check if PostgreSQL service is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql

# Verify PostgreSQL is listening on port 5432
sudo netstat -tlnp | grep 5432
# or
sudo ss -tlnp | grep 5432

# Test direct connection
psql -U postgres -c "SELECT 1"
```

### Issue: "Database 'gaspeep' does not exist"
```bash
# Create the database
sudo -u postgres psql -c "CREATE DATABASE gaspeep;"

# Or as a regular user (if configured)
psql -U postgres -c "CREATE DATABASE gaspeep;"

# Verify it was created
psql -U postgres -l | grep gaspeep
```

### Issue: "Migration failed" or missing tables
```bash
# Check what tables exist
psql -U postgres -d gaspeep -c "\dt"

# Check migration status
psql -U postgres -d gaspeep -c "SELECT * FROM schema_migrations;"

# View migration files
ls -la /home/ubuntu/gaspeep/backend/internal/migrations/

# Backend auto-runs migrations on startup. Check the log output when starting:
# cd /home/ubuntu/gaspeep/backend
# ./bin/api
# Look for "[Migration]" log messages
```

### Issue: "Tests failing with database connection error"
```bash
# Ensure PostgreSQL is running
sudo systemctl status postgresql

# Run tests with explicit local DB connection
cd /home/ubuntu/gaspeep/backend
DB_HOST=localhost DB_PORT=5432 DB_USER=postgres DB_NAME=gaspeep go test ./... -v

# Or let it use defaults (should work if PostgreSQL is running)
go test ./... -v
```

### Issue: "Frontend cannot reach backend API"
```bash
# Make sure backend is running on :8080
lsof -i :8080

# Start backend if not running
cd /home/ubuntu/gaspeep/backend
./bin/api

# Frontend should use BACKEND_URL env var
cd /home/ubuntu/gaspeep/frontend
BACKEND_URL=http://localhost:8080 npm run dev
```

### Issue: "Permission denied" when accessing PostgreSQL
```bash
# Run psql as postgres user
sudo -u postgres psql

# Or configure PostgreSQL to allow local connections
# Check pg_hba.conf:
sudo cat /etc/postgresql/*/main/pg_hba.conf

# Usually, "local" connections are trusted by default
```

## Next Actions (Choose One)

### Option A: Continue with Backend Implementation (Local)
```bash
# Terminal 1: Keep backend running
cd /home/ubuntu/gaspeep/backend
./bin/api

# Terminal 2: Edit and test backend code
cd /home/ubuntu/gaspeep/backend

# Implement remaining service methods:
# 1. ClaimStation() - full workflow
# 2. UpdateStation() - station updates
# 3. SavePhotos() - photo storage
# 4. UnclaimStation() - remove ownership
# 5. ReVerifyStation() - annual re-verification

# Edit files:
# - backend/internal/service/station_owner_service.go
# - backend/internal/repository/pg_station_owner_repository.go

# Run tests while coding
go test ./... -v

# Recompile and restart when done
go build -o bin/api cmd/api/main.go
# Kill and restart backend in Terminal 1
```

### Option B: Integrate with Frontend (Local)
```bash
# Terminal 1: Keep backend running
cd /home/ubuntu/gaspeep/backend
./bin/api

# Terminal 2: Keep frontend running
cd /home/ubuntu/gaspeep/frontend
BACKEND_URL=http://localhost:8080 npm run dev

# Terminal 3: Edit frontend code
cd /home/ubuntu/gaspeep/frontend

# Connect frontend components to real API:
# 1. Update stationOwnerService.ts to call real endpoints
# 2. Replace mock data with API calls
# 3. Add loading/error states
# 4. Implement retry logic

# Edit files:
# - frontend/src/services/stationOwnerService.ts
# - frontend/src/sections/station-owner-dashboard/*.tsx

# Run tests as you develop
npm test

# Changes automatically hot-reload in Terminal 2
```

### Option C: Run Full Integration Tests (Local)
```bash
# Prerequisites: Backend running on :8080, PostgreSQL running

# 1. Run all backend test suites
cd /home/ubuntu/gaspeep/backend && go test ./... -v

# 2. Run all frontend test suites
cd /home/ubuntu/gaspeep/frontend && npm test

# 3. Manual API testing with cURL (see section 5 above)
# Test each endpoint manually against http://localhost:8080

# 4. Performance testing
# Run tests with timing and coverage
go test ./... -v -cover

# 5. End-to-end workflow testing
# Manually test full user flows in frontend against real backend
```

## Useful Commands (Local Development)

```bash
# Backend commands
cd /home/ubuntu/gaspeep/backend

# Build backend
go build -o bin/api cmd/api/main.go

# Run backend
./bin/api

# Run backend with hot-reload (requires air)
make install-air  # one-time setup
make dev          # runs ./scripts/dev.sh

# Run all backend tests
go test ./... -v

# Run specific test
go test ./internal/handler -v -run TestGetProfileEndpoint

# Run tests with coverage
go test ./... -cover

# Frontend commands
cd /home/ubuntu/gaspeep/frontend

# Install dependencies
npm install

# Development server with custom backend
BACKEND_URL=http://localhost:8080 npm run dev

# Run frontend tests
npm test

# Build frontend
npm run build

# Linting
npm run lint

# Database commands
# Access PostgreSQL CLI
psql -U postgres -d gaspeep

# View all tables
psql -U postgres -d gaspeep -c "\dt"

# View specific table schema
psql -U postgres -d gaspeep -c "\d+ stations"

# Run a SQL query
psql -U postgres -d gaspeep -c "SELECT * FROM station_owners LIMIT 10;"

# System commands
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check if port 8080 is in use
lsof -i :8080

# Check if port 5432 is in use
lsof -i :5432
```

## Documentation Locations

All documentation is in the root directory:

```
/home/ubuntu/gaspeep/
├── API_ENDPOINTS.md              ← API reference (23 endpoints documented)
├── TESTING_CHECKLIST.md          ← Test procedures
├── IMPLEMENTATION_STATUS.md      ← Current status
├── PHASE_4_GUIDE.md             ← This file
├── BACKEND_INTEGRATION.md        ← Technical details
└── QUICK_REFERENCE.md           ← Quick lookup
```

## Support

### Documentation Questions?
- Check `API_ENDPOINTS.md` for endpoint details
- Check `IMPLEMENTATION_STATUS.md` for architecture
- Check `TESTING_CHECKLIST.md` for test procedures

### Code Questions?
- Check code comments in service/repository files
- Review types in `types.ts`
- Check test files for usage examples

### Database Questions?
- Check migrations in `backend/internal/migrations/`
- View schema: `psql -U postgres -d gaspeep -c "\dt"`
- Review models in `backend/internal/models/`
- Access PostgreSQL: `psql -U postgres -d gaspeep`

---

## Test Summary (Feb 17, 2026 - Final)

### ✅ Completed
- **Backend Unit Tests**: 8/8 passed ✓
- **Frontend Unit Tests**: 283/284 passed (99.6%) ✓
- **Database**: All 15 tables created and accessible ✓
- **Migrations**: Auto-ran successfully on backend startup ✓

### ✅ Integration Tests (All Passing)
- **Authentication**: POST /api/auth/signin → 200 ✓
- **Station Owner Endpoints**:
  - GET /api/station-owners/profile → 200 ✓
  - GET /api/station-owners/stats → 200 ✓
  - GET /api/station-owners/stations → 200 ✓
  - GET /api/station-owners/fuel-prices → 200 ✓
- **Broadcast Endpoints**:
  - POST /api/broadcasts (create) → 201 ✓
  - GET /api/broadcasts (list) → 200 ✓ (returns JSON array)
  - GET /api/broadcasts/:id (retrieve) → 200 ✓
  - POST /api/broadcasts/draft → 201 ✓
  - POST /api/broadcasts/:id/send (status transition) → 200 ✓
  - POST /api/broadcasts/:id/schedule (schedule) → 200 ✓
- **Error Handling**:
  - Missing auth token → 401 ✓
  - Invalid station ID → 400 ✓
  - Proper JSON error responses ✓

### ✅ Fixed Issues (Integration Testing)

1. **Broadcast Creation Endpoints (POST /broadcasts, POST /broadcasts/draft)**: FIXED ✓
   - **Root Cause**: Three issues:
     1. Missing station owner records in database
     2. `StationOwner.ContactInfo` was non-nullable string, but database allows NULL
     3. `Broadcast.TargetFuelTypes` was `[]string` array, but database stores as TEXT
   - **Solution**:
     - Created test station owners linked to existing users
     - Changed `ContactInfo` field to `*string` (nullable pointer)
     - Changed `TargetFuelTypes` from `[]string` to `*string`
     - Fixed service layer to properly dereference pointers
   - **Status**: Both endpoints working ✓

2. **Broadcast Retrieval Endpoints (GET /api/broadcasts, GET /api/broadcasts/:id)**: FIXED ✓
   - **Root Cause**: Service methods expected `ownerID` but handler was passing `userID`
   - **Solution**:
     - Added `getOwnerID()` helper method to look up station owner from user ID
     - Updated all broadcast service methods to accept `userID` and perform lookup:
       - `GetBroadcasts(userID)` - was getting empty results
       - `GetBroadcast(id, userID)` - was returning not found errors
       - `SendBroadcast(id, userID)` - status transitions
       - `ScheduleBroadcast(id, userID)` - schedule broadcasts
       - `CancelBroadcast(id, userID)` - cancel broadcasts
       - `DeleteBroadcast(id, userID)` - delete broadcasts
       - `DuplicateBroadcast(id, userID)` - duplicate broadcasts
     - Fixed null array marshaling to return `[]` instead of `null` in JSON
   - **Status**: All GET endpoints now working ✓

### ⚠️ Remaining Known Issues
1. **MapPage.spec.tsx**: Jest cannot parse `import.meta.env` in src/lib/api.ts
   - File: `frontend/src/sections/map-and-station-browsing/__tests__/MapPage.spec.tsx`
   - Cause: Jest needs config to handle Vite's `import.meta.env` syntax
   - Impact: 1 test suite fails, but 283 other tests pass

### 🔄 Next Steps
1. Fix frontend test issue (import.meta.env handling)
2. Run integration tests against actual API endpoints (localhost:8080)
3. Test broadcast creation endpoints (known issue from Phase 3)
4. Verify all endpoint error codes (400, 401, 403, 404, 500)
5. Test data integrity and access control

**Status**: Phase 3 Complete, Phase 4 In Progress
**Last Updated**: 2026-02-17
