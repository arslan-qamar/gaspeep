# Quick Test Commands - Copy & Paste Ready

## Setup (Run Once)
```bash
# Get a token (replace with real credentials)
TOKEN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  http://api.gaspeep.com/api/auth/signin | jq -r '.token')

# Verify token
echo "Token: $TOKEN"

# Set API URL
API="http://api.gaspeep.com/api"
```

---

## Profile Tests (Copy & Paste)

### Test 1: Get Profile
```bash
curl -H "Authorization: Bearer $TOKEN" $API/station-owners/profile | jq
```
✓ Should return 200 with owner profile data

### Test 2: Get Stats
```bash
curl -H "Authorization: Bearer $TOKEN" $API/station-owners/stats | jq
```
✓ Should return 200 with dashboard stats

### Test 3: Get Fuel Prices
```bash
curl -H "Authorization: Bearer $TOKEN" $API/station-owners/fuel-prices | jq
```
✓ Should return 200 with prices grouped by station

---

## Station Tests (Copy & Paste)

### Test 4: List Stations
```bash
curl -H "Authorization: Bearer $TOKEN" $API/station-owners/stations | jq
```
✓ Should return 200 with array of stations

### Test 5: Get Single Station
```bash
# Replace station_id with a real ID
curl -H "Authorization: Bearer $TOKEN" $API/station-owners/stations/station_id | jq
```
✓ Should return 200 with station + fuel prices

### Test 6: Search Stations
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "$API/station-owners/search-stations?query=shell&lat=-33.8688&lon=151.2093&radius=5" | jq
```
✓ Should return 200 with nearby stations matching search

### Test 7: Update Station
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","operatingHours":"6:00-23:00"}' \
  $API/station-owners/stations/station_id | jq
```
✓ Should return 200 with updated station

---

## Broadcast Tests (Copy & Paste)

### Test 8: List Broadcasts
```bash
curl -H "Authorization: Bearer $TOKEN" $API/broadcasts | jq
```
✓ Should return 200 with array of broadcasts

### Test 9: Create Broadcast
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station_id",
    "title": "Test Broadcast",
    "message": "Test message",
    "targetRadiusKm": 10,
    "startDate": "2026-02-21T00:00:00Z",
    "endDate": "2026-02-23T23:59:59Z",
    "targetFuelTypes": "fuel_diesel"
  }' \
  $API/broadcasts | jq
```
✓ Should return 201 with new broadcast (status: "scheduled")

### Test 10: Get Broadcast
```bash
# Use the ID from the create response
curl -H "Authorization: Bearer $TOKEN" $API/broadcasts/broadcast_id | jq
```
✓ Should return 200 with broadcast details

### Test 11: Save Draft
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station_id",
    "title": "Draft Broadcast",
    "message": "Saved as draft",
    "targetRadiusKm": 10,
    "startDate": "2026-02-21T00:00:00Z",
    "endDate": "2026-02-23T23:59:59Z",
    "targetFuelTypes": "fuel_diesel"
  }' \
  $API/broadcasts/draft | jq
```
✓ Should return 201 with status: "draft"

### Test 12: Send Broadcast
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_id/send | jq
```
✓ Should return 200 with status changed to "active"

### Test 13: Schedule Broadcast
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduledFor": "2026-02-20T14:00:00Z"}' \
  $API/broadcasts/broadcast_id/schedule | jq
```
✓ Should return 200 with status: "scheduled"

### Test 14: Update Broadcast
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "message": "Updated message"}' \
  $API/broadcasts/broadcast_id | jq
```
✓ Should return 200 with updated broadcast

### Test 15: Duplicate Broadcast
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_id/duplicate | jq
```
✓ Should return 201 with new broadcast (title has " (Copy)" suffix)

### Test 16: Cancel Scheduled
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_id/cancel | jq
```
✓ Should return 200 with status: "cancelled"

### Test 17: Delete Broadcast
```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_id | jq
```
✓ Should return 204 (No Content)

### Test 18: Get Engagement
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_id/engagement | jq
```
✓ Should return 200 with analytics array

---

## Error Tests (Copy & Paste)

### Test 19: Missing Token (401)
```bash
curl $API/broadcasts | jq
```
✗ Should return 401: "Unauthorized"

### Test 20: Invalid Token (401)
```bash
curl -H "Authorization: Bearer invalid" $API/broadcasts | jq
```
✗ Should return 401: "Invalid token"

### Test 21: Not Found (404)
```bash
curl -H "Authorization: Bearer $TOKEN" $API/broadcasts/fake_id | jq
```
✗ Should return 404: "Not found"

### Test 22: Bad Request (400)
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Missing fields"}' \
  $API/broadcasts | jq
```
✗ Should return 400: "Missing required field"

---

## Summary Test (Run All at Once)

```bash
#!/bin/bash
export TOKEN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  http://api.gaspeep.com/api/auth/signin | jq -r '.token')
export API="http://api.gaspeep.com/api"

echo "Testing Profile Endpoints..."
curl -s -H "Authorization: Bearer $TOKEN" $API/station-owners/profile | jq '.id'
curl -s -H "Authorization: Bearer $TOKEN" $API/station-owners/stats | jq '.totalStations'
curl -s -H "Authorization: Bearer $TOKEN" $API/station-owners/fuel-prices | jq '.pricesByStation'

echo "Testing Broadcast Endpoints..."
curl -s -H "Authorization: Bearer $TOKEN" $API/broadcasts | jq 'length'

echo "Testing Error Handling..."
curl -s $API/broadcasts | jq '.error'

echo "✓ All quick tests completed!"
```

---

## Notes

- Replace `station_id` and `broadcast_id` with real IDs from your test data
- Use `| jq` to pretty-print JSON responses (requires `jq` installed)
- Dates must be ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- All endpoints require `Authorization: Bearer $TOKEN` header

---

**Last Updated:** 2026-02-17
