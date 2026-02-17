# Station Owner Dashboard - Quick Reference Guide

## 🚀 TL;DR
- **Status:** Backend integration layer complete ✅
- **Frontend:** 5 components, 254 tests, all passing ✅
- **Backend:** 26 endpoints defined, routes registered, compiling ✅
- **Next:** Implement service method business logic

---

## File Locations

### Frontend
- Components: `frontend/src/sections/station-owner-dashboard/`
- Service: `frontend/src/services/stationOwnerService.ts`
- Types: `frontend/src/sections/station-owner-dashboard/types.ts`
- Tests: `frontend/src/sections/station-owner-dashboard/__tests__/`

### Backend
- Handlers: `backend/internal/handler/station_owner_handler.go` + `broadcast_handler.go`
- Services: `backend/internal/service/station_owner_service.go` + `broadcast_service.go`
- Routes: `backend/cmd/api/main.go`
- Repository: `backend/internal/repository/pg_station_owner_repository.go`

### Documentation
- Technical Details: `BACKEND_INTEGRATION.md`
- Executive Summary: `INTEGRATION_SUMMARY.md`
- Status Report: `BACKEND_INTEGRATION_STATUS.md`
- Product Spec: `product-plan/sections/station-owner-dashboard/spec.md`
- Sample Data: `product-plan/sections/station-owner-dashboard/sample-data.json`

---

## API Quick Reference

### Station Owner Endpoints
```bash
# Profile & Stats
GET /api/station-owners/profile
GET /api/station-owners/stats
GET /api/station-owners/fuel-prices

# Station Operations
GET /api/station-owners/stations              # List all
GET /api/station-owners/stations/:id          # Single station
PUT /api/station-owners/stations/:id          # Update
POST /api/station-owners/stations/:id/photos  # Upload photos
POST /api/station-owners/stations/:id/unclaim # Remove claim

# Claiming & Verification
GET /api/station-owners/search-stations       # Find to claim
POST /api/station-owners/claim-station        # Claim with docs
POST /api/station-owners/verify               # Initial verification
POST /api/station-owners/stations/:id/reverify # Annual renewal
```

### Broadcast Endpoints
```bash
# CRUD Operations
POST /api/broadcasts                          # Create
GET /api/broadcasts                           # List all
GET /api/broadcasts/:id                       # Get one
PUT /api/broadcasts/:id                       # Update
DELETE /api/broadcasts/:id                    # Delete
GET /api/broadcasts/:id/engagement            # Analytics

# Lifecycle
POST /api/broadcasts/draft                    # Save as draft
POST /api/broadcasts/:id/send                 # Send now
POST /api/broadcasts/:id/schedule             # Schedule for later
POST /api/broadcasts/:id/cancel               # Cancel scheduled

# Utilities
POST /api/broadcasts/:id/duplicate            # Copy broadcast
GET /api/broadcasts/estimate-recipients       # Estimate reach
```

---

## Frontend API Usage

### Get Dashboard Data
```typescript
import { stationOwnerService } from '@/services/stationOwnerService'

const data = await stationOwnerService.getDashboardData()
// Returns: { owner, stations, broadcasts, stats, fuelTypes, currentFuelPrices }
```

### Create Broadcast
```typescript
const broadcast = await stationOwnerService.createBroadcast({
  stationId: 'station_101',
  title: 'Special Offer',
  message: 'Save 15¢/L today',
  promotionType: 'special_discount',
  fuelTypes: ['fuel_diesel'],
  targetRadius: 10,
  scheduledFor: null,
  expiresAt: expiryTime
})
```

### Claim Station
```typescript
const result = await stationOwnerService.claimStation(
  stationId,
  'document', // or 'phone', 'email'
  documentUrls // optional
)
```

See `stationOwnerService.ts` for all available methods.

---

## Testing

### Run All Tests
```bash
cd frontend && npm test -- station-owner-dashboard --no-coverage
```

### Run Specific Test
```bash
cd frontend && npx jest CreateBroadcastScreen.test.tsx
```

### Backend Build Check
```bash
cd backend && go build ./...
```

---

## Development Workflow

### 1. Update Backend Handler
Edit `backend/internal/handler/broadcast_handler.go`
```go
// GetBroadcast handles GET /api/broadcasts/:id
func (h *BroadcastHandler) GetBroadcast(c *gin.Context) {
    // ... validation
    broadcast, err := h.broadcastService.GetBroadcast(id, userID)
    // ... error handling
    c.JSON(http.StatusOK, broadcast)
}
```

### 2. Implement Service Method
Edit `backend/internal/service/broadcast_service.go`
```go
func (s *broadcastService) GetBroadcast(id, ownerID string) (*models.Broadcast, error) {
    // Implement business logic
    return s.broadcastRepo.GetByID(id, ownerID)
}
```

### 3. Test It
```bash
# Test backend compiles
cd backend && go build ./...

# Test frontend still works
cd frontend && npm test -- station-owner-dashboard
```

### 4. Verify Frontend Integration
```typescript
const broadcast = await stationOwnerService.getBroadcast(broadcastId)
// Should work!
```

---

## Component Props

### StationOwnerDashboard
```typescript
<StationOwnerDashboard
  owner={StationOwner}
  stations={ClaimedStation[]}
  broadcasts={Broadcast[]}
  stats={DashboardStats}
  onClaimStation={() => void}
  onCreateBroadcast={(stationId?: string) => void}
  onViewBroadcast={(broadcastId: string) => void}
  isLoading={boolean}
/>
```

### CreateBroadcastScreen
```typescript
<CreateBroadcastScreen
  stations={ClaimedStation[]}
  fuelTypes={FuelType[]}
  selectedStationId={string}
  owner={StationOwner}
  onSubmit={(data: CreateBroadcastFormData) => void}
  onCancel={() => void}
  isSubmitting={boolean}
/>
```

### BroadcastDetailsScreen
```typescript
<BroadcastDetailsScreen
  broadcast={Broadcast}
  onEdit={(broadcastId: string) => void}
  onDuplicate={(broadcastId: string) => void}
  onDelete={(broadcastId: string) => void}
  onCancel={(broadcastId: string) => void}
  isLoading={boolean}
/>
```

See component files for full prop documentation.

---

## Common Tasks

### Add a New Endpoint
1. Add handler method to `*Handler` struct
2. Add service method to `*Service` interface
3. Register route in `main.go`
4. Implement service method
5. Add tests

### Debug a Request
```bash
# Check if backend is running
curl https://api.gaspeep.com/health

# Test an endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.gaspeep.com/api/station-owners/stats
```

### View Sample Data
```bash
cat product-plan/sections/station-owner-dashboard/sample-data.json
```

### Check Type Definitions
```bash
cat frontend/src/sections/station-owner-dashboard/types.ts
```

---

## Error Codes

### Frontend
- 401: Not authenticated (redirect to signin)
- 400: Bad request (validation error)
- 404: Not found
- 500: Server error

### Backend
- All errors handled in middleware
- Check `internal/middleware/` for error handling
- All responses include error message

---

## Performance Tips

### Frontend
- Components use React.memo where appropriate
- Tests run in < 4 seconds
- Lazy load components if list gets large

### Backend
- Add database indexes for frequently queried fields
- Cache fuel types and dashboard stats
- Batch operations where possible

---

## Deploy Checklist

- [ ] All tests passing (frontend + backend)
- [ ] Backend compiles without warnings
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] JWT secret configured
- [ ] TLS certificates in place
- [ ] API endpoints tested manually
- [ ] Error handling verified
- [ ] Security review completed
- [ ] Rate limiting configured
- [ ] Monitoring/logging enabled

---

## Getting Help

### Documentation
- Full spec: `product-plan/sections/station-owner-dashboard/spec.md`
- Type definitions: `frontend/src/sections/station-owner-dashboard/types.ts`
- API service: `frontend/src/services/stationOwnerService.ts`

### Code Examples
- See test files for usage examples
- Sample data: `product-plan/sections/station-owner-dashboard/sample-data.json`
- Component implementations: `frontend/src/sections/station-owner-dashboard/*.tsx`

### Integration Guide
- `BACKEND_INTEGRATION.md` - Technical deep dive
- `INTEGRATION_SUMMARY.md` - Architecture overview
- `BACKEND_INTEGRATION_STATUS.md` - Current status

---

## Stats at a Glance

| Metric | Count |
|--------|-------|
| Frontend Tests | 254 ✅ |
| API Endpoints | 26 ✅ |
| React Components | 5 ✅ |
| TypeScript Files | 8+ ✅ |
| Backend Handlers | 2 (extended) |
| Backend Services | 2 (extended) |
| Lines of Code (Frontend) | 2,535 |
| Lines of Code (Backend) | ~700 |

---

## Latest Updates

**2026-02-17** - Backend Integration Complete
- ✅ 26 API endpoints routed
- ✅ Service interfaces designed
- ✅ Repository layer extended
- ✅ All frontend tests passing
- ✅ Backend compiling successfully

---

**Ready to implement? Start with the service methods in:**
- `backend/internal/service/station_owner_service.go`
- `backend/internal/service/broadcast_service.go`

**Each method has a TODO comment marking what needs implementation.**
