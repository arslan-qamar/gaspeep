# API Testing Verification Guide

## What to Look For in Responses

### ✅ Success Indicators

Each endpoint should return specific indicators that show it's working correctly:

---

## 1. Profile Endpoint (`GET /api/station-owners/profile`)

**✅ Success Indicators:**
- Status code: **200 OK**
- Contains `id` field
- Contains `verificationStatus` field (value: "verified", "pending", or "unverified")
- Contains `broadcastsThisWeek` number
- Contains `broadcastLimit` number

**Example Good Response:**
```json
{
  "id": "owner_abc123",
  "userId": "user_xyz789",
  "businessName": "Coastal Fuel",
  "verificationStatus": "verified",
  "broadcastsThisWeek": 5,
  "broadcastLimit": 20
}
```

**❌ Problem Response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```
→ Token is invalid or expired. Get a new one.

---

## 2. Statistics Endpoint (`GET /api/station-owners/stats`)

**✅ Success Indicators:**
- Status code: **200 OK**
- `totalStations` is a number ≥ 0
- `verifiedStations` is a number ≤ `totalStations`
- `activeBroadcasts` is a number ≥ 0
- `broadcastsThisWeek` is a number ≥ 0

**Example Good Response:**
```json
{
  "totalStations": 3,
  "verifiedStations": 2,
  "activeBroadcasts": 1,
  "totalReachThisMonth": 5234,
  "averageEngagementRate": 0.28,
  "broadcastsThisWeek": 5,
  "broadcastLimit": 20
}
```

**Verify:**
- `verifiedStations` should be ≤ `totalStations`
- All numbers should be non-negative

---

## 3. Fuel Prices Endpoint (`GET /api/station-owners/fuel-prices`)

**✅ Success Indicators:**
- Status code: **200 OK**
- Contains `pricesByStation` object
- Each station ID maps to an array of fuel types
- Each fuel price has: `fuelTypeId`, `fuelTypeName`, `price`, `currency`

**Example Good Response:**
```json
{
  "pricesByStation": {
    "station_101": [
      {
        "fuelTypeId": "fuel_unleaded_91",
        "fuelTypeName": "Unleaded 91",
        "price": 2.19,
        "currency": "AUD",
        "lastUpdated": "2026-02-17T08:30:00Z",
        "verificationStatus": "verified"
      },
      {
        "fuelTypeId": "fuel_diesel",
        "fuelTypeName": "Diesel",
        "price": 2.29,
        "currency": "AUD",
        "lastUpdated": "2026-02-17T08:30:00Z"
      }
    ]
  }
}
```

**Verify:**
- Prices are positive numbers
- Currency is 3 letters (e.g., "AUD")
- Station IDs are non-empty strings

---

## 4. List Stations Endpoint (`GET /api/station-owners/stations`)

**✅ Success Indicators:**
- Status code: **200 OK**
- Response is an array `[]`
- Each station has: `id`, `name`, `brand`, `address`, `latitude`, `longitude`
- Latitude range: -90 to 90
- Longitude range: -180 to 180

**Example Good Response:**
```json
[
  {
    "id": "station_101",
    "name": "Coastal Shell",
    "brand": "Shell",
    "address": "123 Main St, Sydney NSW 2000",
    "latitude": -33.8688,
    "longitude": 151.2093,
    "operatingHours": "24/7"
  }
]
```

**Verify:**
- Array is not empty (if owner has stations)
- All coordinates are valid
- No duplicate station IDs

---

## 5. List Broadcasts Endpoint (`GET /api/broadcasts`)

**✅ Success Indicators:**
- Status code: **200 OK**
- Response is an array `[]`
- Each broadcast has: `id`, `stationId`, `title`, `broadcastStatus`
- `broadcastStatus` is one of: "draft", "scheduled", "active", "cancelled"
- `views` and `clicks` are non-negative numbers

**Example Good Response:**
```json
[
  {
    "id": "broadcast_001",
    "stationId": "station_101",
    "title": "Weekend Special",
    "broadcastStatus": "active",
    "views": 234,
    "clicks": 42,
    "createdAt": "2026-02-17T10:30:00Z"
  }
]
```

**Verify:**
- No duplicate broadcast IDs
- `broadcastStatus` is one of valid statuses
- `views` and `clicks` are non-negative

---

## 6. Create Broadcast Endpoint (`POST /api/broadcasts`)

**✅ Success Indicators:**
- Status code: **201 Created**
- Response includes `id` field (new broadcast ID)
- `broadcastStatus` is "scheduled" (default)
- Contains all submitted fields
- Includes `createdAt` timestamp

**Example Good Response:**
```json
{
  "id": "broadcast_new_001",
  "stationId": "station_101",
  "title": "Weekend Diesel Special",
  "broadcastStatus": "scheduled",
  "targetRadiusKm": 10,
  "startDate": "2026-02-21T00:00:00Z",
  "endDate": "2026-02-23T23:59:59Z",
  "createdAt": "2026-02-17T10:30:00Z"
}
```

**Verify:**
- New `id` is generated
- Status is "scheduled"
- Start date is before end date
- `targetRadiusKm` is positive

---

## 7. Send Broadcast Endpoint (`POST /api/broadcasts/{id}/send`)

**✅ Success Indicators:**
- Status code: **200 OK**
- `broadcastStatus` changed to "active"
- Includes `sentAt` timestamp

**Example Good Response:**
```json
{
  "id": "broadcast_001",
  "broadcastStatus": "active",
  "sentAt": "2026-02-17T10:45:00Z",
  "estimatedReach": 1234
}
```

**Verify:**
- Status changed from "scheduled" to "active"
- `sentAt` is a recent timestamp
- Estimated reach is a reasonable number

---

## 8. Schedule Broadcast Endpoint (`POST /api/broadcasts/{id}/schedule`)

**✅ Success Indicators:**
- Status code: **200 OK**
- `broadcastStatus` is "scheduled"
- `scheduledFor` matches the requested time

**Example Good Response:**
```json
{
  "id": "broadcast_001",
  "broadcastStatus": "scheduled",
  "scheduledFor": "2026-02-20T14:00:00Z"
}
```

**Verify:**
- `scheduledFor` is a future timestamp
- Status is "scheduled"

---

## Error Response Verification

### 401 Unauthorized

**When:** No token or invalid token

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid token"
}
```

**Verify:**
- Status code is **401**
- Error message is clear

---

### 404 Not Found

**When:** Endpoint references non-existent resource

**Expected Response:**
```json
{
  "error": "Not found",
  "message": "Broadcast not found"
}
```

**Verify:**
- Status code is **404**
- Error message identifies what was not found

---

### 400 Bad Request

**When:** Invalid input data

**Expected Response:**
```json
{
  "error": "Bad request",
  "message": "Missing required field: stationId"
}
```

**Verify:**
- Status code is **400**
- Message explains what's wrong
- Message helps you fix the request

---

## Testing Workflow

### Step 1: Get Token ✅
```bash
TOKEN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  http://api.gaspeep.com/api/auth/signin | jq -r '.token')
```

**Verify:**
- Token is non-empty string
- Token looks like JWT (has 3 parts separated by dots)

---

### Step 2: Test Profile ✅
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://api.gaspeep.com/api/station-owners/profile | jq
```

**Verify:**
- Status is 200
- Response contains owner data
- All expected fields present

---

### Step 3: Test Stations ✅
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://api.gaspeep.com/api/station-owners/stations | jq
```

**Verify:**
- Status is 200
- Response is an array
- Each station has required fields

---

### Step 4: Test Broadcasts ✅
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://api.gaspeep.com/api/broadcasts | jq
```

**Verify:**
- Status is 200
- Response is an array
- Each broadcast has required fields

---

### Step 5: Create Broadcast ✅
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}' \
  http://api.gaspeep.com/api/broadcasts | jq
```

**Verify:**
- Status is 201 (not 200)
- New ID is generated
- Status is "scheduled"
- All fields are preserved

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Token expired/invalid | Get new token |
| 404 Not Found | Wrong ID format | Verify ID from list endpoint |
| 400 Bad Request | Missing field | Check required fields in request |
| Connection refused | Backend not running | `docker compose up api` |
| Empty array | No data created yet | Create test data first |
| Wrong status code | Endpoint issue | Check endpoint path |

---

## Success Criteria Checklist

When all of these pass, your API is working correctly:

- [ ] Profile endpoint returns 200 with owner data
- [ ] Stats endpoint returns 200 with numbers
- [ ] Fuel prices endpoint returns 200 with prices object
- [ ] Stations list endpoint returns 200 with array
- [ ] Broadcasts list endpoint returns 200 with array
- [ ] Create broadcast returns 201 with new ID
- [ ] Get broadcast returns 200 with details
- [ ] Send broadcast returns 200 with active status
- [ ] Delete broadcast returns 204
- [ ] Unauthorized request returns 401
- [ ] Non-existent resource returns 404
- [ ] Invalid data returns 400

---

**Last Updated:** 2026-02-17
