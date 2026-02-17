# Station Owner Dashboard - Testing Checklist

## Unit Tests Status

### Backend Tests ✅
- [x] Handler tests compile without errors
- [x] Service tests compile without errors
- [x] Repository tests compile without errors
- [x] Auth handler test passes
- [x] Endpoint integration tests (8 tests) pass

**Run tests:**
```bash
cd backend && go test ./... -v
```

### Frontend Tests ✅
- [x] All 254 station owner dashboard tests pass
- [x] 5 test suites (BroadcastDetailsScreen, StationOwnerDashboard, etc.)
- [x] Components render correctly with mock data
- [x] User interactions trigger callbacks
- [x] Loading/error states work

**Run tests:**
```bash
cd frontend && npm test -- station-owner-dashboard
```

---

## Integration Test Plan

### 1. Database Setup
- [ ] Apply migration 011 (add owner_id to stations)
- [ ] Apply migration 012 (create station_photos table)
- [ ] Apply migration 013 (create claim_verifications table)
- [ ] Apply migration 014 (create broadcast_analytics table)
- [ ] Verify all tables created successfully
- [ ] Check foreign key constraints are in place

**Run migrations:**
```bash
docker compose up -d postgres
# Migrations auto-run on backend startup
```

### 2. Backend API Testing

#### Station Owner Profile Endpoints
- [ ] GET /api/station-owners/profile returns 200 with profile data
- [ ] GET /api/station-owners/stats returns 200 with statistics
- [ ] GET /api/station-owners/fuel-prices returns 200 with prices grouped by station
- [ ] Endpoints return 401 without authentication
- [ ] Endpoints return 404 if owner doesn't exist

#### Station Management Endpoints
- [ ] GET /api/station-owners/stations returns list of owned stations
- [ ] GET /api/station-owners/stations/:id returns single station with fuel prices
- [ ] PUT /api/station-owners/stations/:id updates station details
- [ ] POST /api/station-owners/stations/:id/photos stores photos
- [ ] GET /api/station-owners/search-stations searches available stations
- [ ] POST /api/station-owners/claim-station creates claim record
- [ ] POST /api/station-owners/stations/:id/unclaim removes ownership
- [ ] POST /api/station-owners/stations/:id/reverify creates re-verification request

#### Broadcast Endpoints
- [ ] POST /api/broadcasts creates new broadcast with status "scheduled"
- [ ] GET /api/broadcasts returns list of owner's broadcasts
- [ ] GET /api/broadcasts/:id returns broadcast details with ownership check
- [ ] PUT /api/broadcasts/:id updates broadcast
- [ ] POST /api/broadcasts/:id/send changes status to "active"
- [ ] POST /api/broadcasts/:id/schedule sets scheduled time
- [ ] POST /api/broadcasts/:id/cancel changes status to "cancelled"
- [ ] POST /api/broadcasts/:id/duplicate creates copy with new ID
- [ ] DELETE /api/broadcasts/:id removes broadcast
- [ ] POST /api/broadcasts/draft saves with status "draft"
- [ ] GET /api/broadcasts/:id/engagement returns analytics data

#### Error Handling
- [ ] 400 Bad Request for invalid parameters
- [ ] 401 Unauthorized for missing/invalid token
- [ ] 403 Forbidden for ownership violations
- [ ] 404 Not Found for missing resources
- [ ] 500 Internal Server Error with meaningful messages

### 3. Data Integrity Tests

#### Ownership Validation
- [ ] User A cannot access User B's stations
- [ ] User A cannot access User B's broadcasts
- [ ] User A cannot update User B's station details
- [ ] Unclaiming station sets owner_id to NULL

#### Status Transitions
- [ ] Broadcast status changes: draft → scheduled → active
- [ ] Broadcast status changes: scheduled → cancelled
- [ ] Station verification_status: unverified → pending → verified
- [ ] Claim verification_status: pending → approved/rejected

#### Data Consistency
- [ ] Fuel prices stay linked to correct stations
- [ ] Photos are associated with correct stations
- [ ] Claims reference correct station and owner
- [ ] Analytics linked to correct broadcasts

### 4. Performance Testing

#### Query Performance
- [ ] GetFuelPricesForOwner() completes in < 500ms for 10 stations
- [ ] SearchAvailableStations() completes in < 1s for 1000 station search
- [ ] GetBroadcasts() completes in < 200ms for 50 broadcasts
- [ ] Database indexes are being used effectively

#### Load Testing
- [ ] API handles 100 concurrent users
- [ ] Create broadcast endpoint can handle 50 req/sec
- [ ] No memory leaks after 10 minutes of load

**Tools:**
```bash
# Apache Bench
ab -n 1000 -c 100 https://api.gaspeep.com/api/station-owners/profile

# k6 load testing
k6 run load-test.js
```

### 5. Security Testing

#### Authentication & Authorization
- [ ] All endpoints require valid JWT token
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected
- [ ] CORS headers are properly set

#### Input Validation
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are sanitized
- [ ] Large file uploads are rejected
- [ ] Invalid JSON is rejected

#### Data Protection
- [ ] Sensitive data not logged
- [ ] Passwords not returned in responses
- [ ] Rate limiting prevents brute force
- [ ] File uploads have size limits

### 6. Frontend Integration Testing

#### Component Integration
- [ ] StationOwnerDashboard loads and displays data
- [ ] CreateBroadcastScreen submits data correctly
- [ ] BroadcastDetailsScreen shows broadcast data
- [ ] ClaimStationScreen initiates claim process
- [ ] StationDetailsScreen displays station info

#### API Integration
- [ ] Frontend service calls backend correctly
- [ ] Response data matches expected types
- [ ] Error responses are handled gracefully
- [ ] Loading states display during API calls
- [ ] Retry logic works for failed requests

#### User Workflows
- [ ] User can view profile and statistics
- [ ] User can create and schedule broadcasts
- [ ] User can claim a station
- [ ] User can update station details
- [ ] User can view broadcast analytics

### 7. Migration Testing

#### Forward Migrations
- [ ] Migration 011 adds owner_id and verification_status
- [ ] Migration 012 creates station_photos table
- [ ] Migration 013 creates claim_verifications table
- [ ] Migration 014 creates broadcast_analytics table
- [ ] All indexes are created
- [ ] All foreign keys are valid

#### Rollback Testing
- [ ] Migration 011 rollback removes columns
- [ ] Migration 012 rollback removes table
- [ ] Migration 013 rollback removes table
- [ ] Migration 014 rollback removes table
- [ ] Data is not lost unnecessarily

### 8. End-to-End Workflows

#### Complete Claim Workflow
1. [ ] Owner searches for unclaimed station
2. [ ] Owner initiates claim with documents
3. [ ] Backend creates claim_verification record
4. [ ] Owner can see pending verification status
5. [ ] (Admin) Verification approved
6. [ ] Station owner_id updated
7. [ ] Owner can now manage station

#### Complete Broadcast Workflow
1. [ ] Owner creates new broadcast
2. [ ] Broadcast saved with status "draft"
3. [ ] Owner can edit/update broadcast
4. [ ] Owner schedules broadcast for later
5. [ ] At scheduled time, status changes to "active"
6. [ ] Broadcast notifications sent to users
7. [ ] Analytics track delivered/opened/clicked metrics
8. [ ] Owner can view engagement metrics

#### Station Management Workflow
1. [ ] Owner claims station
2. [ ] Owner uploads station photos
3. [ ] Owner updates operating hours/amenities
4. [ ] Changes are visible to users
5. [ ] Owner can view fuel prices at station
6. [ ] Annual re-verification can be initiated

---

## Test Environment Setup

### Prerequisites
```bash
# Install dependencies
cd backend && go mod tidy
cd ../frontend && npm install

# Build docker images
docker compose build
```

### Start Services
```bash
# Start all services
docker compose up -d

# Check services are running
docker compose ps

# View logs
docker compose logs -f api
```

### Database Access
```bash
# Connect to postgres
docker compose exec postgres psql -U postgres -d gaspeep

# Check tables
\dt

# Check migrations
SELECT * FROM schema_migrations;
```

---

## Manual Testing Script

### Using cURL

```bash
# Set token (get from login endpoint)
export TOKEN="your_jwt_token_here"

# 1. Get Profile
curl -H "Authorization: Bearer $TOKEN" \
  https://api.gaspeep.com/api/station-owners/profile

# 2. Get Statistics
curl -H "Authorization: Bearer $TOKEN" \
  https://api.gaspeep.com/api/station-owners/stats

# 3. List Stations
curl -H "Authorization: Bearer $TOKEN" \
  https://api.gaspeep.com/api/station-owners/stations

# 4. Create Broadcast
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
  https://api.gaspeep.com/api/broadcasts

# 5. Get Broadcasts
curl -H "Authorization: Bearer $TOKEN" \
  https://api.gaspeep.com/api/broadcasts

# 6. Send Broadcast
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  https://api.gaspeep.com/api/broadcasts/{broadcast_id}/send

# 7. Schedule Broadcast
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledFor": "2026-02-20T14:00:00Z"
  }' \
  https://api.gaspeep.com/api/broadcasts/{broadcast_id}/schedule

# 8. Get Engagement Analytics
curl -H "Authorization: Bearer $TOKEN" \
  https://api.gaspeep.com/api/broadcasts/{broadcast_id}/engagement
```

### Using Postman
1. Import API_ENDPOINTS.md examples
2. Set environment variable for Bearer token
3. Run requests sequentially
4. Verify response status codes and data

---

## Test Results Template

```
Test Date: 2026-02-17
Tester: [Name]
Environment: Development

## Summary
Total Tests: [ ]
Passed: [ ]
Failed: [ ]
Blocked: [ ]

## Issues Found
1. [Issue] - [Severity] - [Status]
2. [Issue] - [Severity] - [Status]

## Sign Off
Tested by: _____________
Approved by: _____________
```

---

## Known Limitations

### Current Implementation
- [ ] SearchAvailableStations requires owner_id migration
- [ ] ClaimStation logic not fully implemented
- [ ] Photo upload uses mock storage
- [ ] EstimateRecipients returns placeholder value
- [ ] GetEngagement requires analytics table data

### TODO Before Production
- [ ] Add SQL query test harness
- [ ] Add load test suite
- [ ] Add security scanning
- [ ] Add API documentation generation
- [ ] Add monitoring/alerting

---

## Sign-Off Criteria

Before marking tests as complete:
- [ ] All unit tests pass (backend + frontend)
- [ ] All integration tests pass
- [ ] All migrations apply without errors
- [ ] No SQL injection vulnerabilities
- [ ] No CORS issues
- [ ] API response times acceptable
- [ ] All endpoints return proper status codes
- [ ] Error handling is comprehensive
- [ ] Documentation is up to date

---

Last Updated: 2026-02-17
Status: In Progress
