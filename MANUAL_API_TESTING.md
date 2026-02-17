# Manual API Testing Guide

## Getting Started

### 1. Get a JWT Token

First, you need to authenticate to get a JWT token. Sign up or log in:

```bash
# Sign up (create new user)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123",
    "displayName": "Station Owner"
  }' \
  http://api.gaspeep.com/api/auth/signup

# Or sign in (if user exists)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123"
  }' \
  http://api.gaspeep.com/api/auth/signin
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "owner@example.com",
    "displayName": "Station Owner"
  }
}
```

### 2. Save the Token

```bash
export TOKEN="your_token_here"
export API="http://api.gaspeep.com/api"
```

---

## Testing Endpoints

### Station Owner Profile Endpoints

#### GET Profile
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/station-owners/profile
```

**Expected Response (200):**
```json
{
  "id": "owner_001",
  "userId": "user_501",
  "businessName": "Coastal Fuel Group",
  "verificationStatus": "verified",
  "broadcastsThisWeek": 5,
  "broadcastLimit": 20
}
```

---

#### GET Statistics
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/station-owners/stats
```

**Expected Response (200):**
```json
{
  "totalStations": 3,
  "verifiedStations": 2,
  "activeBroadcasts": 1,
  "broadcastsThisWeek": 5,
  "broadcastLimit": 20
}
```

---

#### GET Fuel Prices
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/station-owners/fuel-prices
```

**Expected Response (200):**
```json
{
  "pricesByStation": {
    "station_101": [
      {
        "fuelTypeId": "fuel_unleaded_91",
        "fuelTypeName": "Unleaded 91",
        "price": 2.19,
        "currency": "AUD",
        "lastUpdated": "2026-02-17T08:30:00Z"
      }
    ]
  }
}
```

---

### Station Management Endpoints

#### GET All Stations
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/station-owners/stations
```

**Expected Response (200):**
```json
[
  {
    "id": "station_101",
    "name": "Coastal Shell",
    "brand": "Shell",
    "address": "123 Main St",
    "latitude": -33.8688,
    "longitude": 151.2093
  }
]
```

---

#### GET Single Station (with prices)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/station-owners/stations/station_101
```

**Expected Response (200):**
```json
{
  "id": "station_101",
  "name": "Coastal Shell",
  "brand": "Shell",
  "address": "123 Main St",
  "latitude": -33.8688,
  "longitude": 151.2093,
  "fuelPrices": [
    {
      "fuelTypeId": "fuel_unleaded_91",
      "fuelTypeName": "Unleaded 91",
      "price": 2.19
    }
  ]
}
```

---

#### UPDATE Station
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Station Name",
    "operatingHours": "6:00-23:00"
  }' \
  $API/station-owners/stations/station_101
```

**Expected Response (200):**
```json
{
  "id": "station_101",
  "name": "Updated Station Name",
  "operatingHours": "6:00-23:00"
}
```

---

#### SEARCH Available Stations
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "$API/station-owners/search-stations?query=Shell&lat=-33.8688&lon=151.2093&radius=5"
```

**Expected Response (200):**
```json
[
  {
    "id": "station_201",
    "name": "Shell Station - Parramatta",
    "brand": "Shell",
    "address": "456 Church Street",
    "latitude": -33.8194,
    "longitude": 151.0016,
    "distanceKm": 4.2
  }
]
```

---

### Broadcast Endpoints

#### GET All Broadcasts
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts
```

**Expected Response (200):**
```json
[
  {
    "id": "broadcast_001",
    "stationId": "station_101",
    "title": "Weekend Diesel Special",
    "broadcastStatus": "active",
    "views": 234,
    "clicks": 42
  }
]
```

---

#### CREATE Broadcast
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station_101",
    "title": "Weekend Diesel Special",
    "message": "Save 15¢/L on Diesel this weekend",
    "targetRadiusKm": 10,
    "startDate": "2026-02-21T00:00:00Z",
    "endDate": "2026-02-23T23:59:59Z",
    "targetFuelTypes": "fuel_diesel"
  }' \
  $API/broadcasts
```

**Expected Response (201):**
```json
{
  "id": "broadcast_001",
  "stationId": "station_101",
  "title": "Weekend Diesel Special",
  "broadcastStatus": "scheduled",
  "createdAt": "2026-02-17T10:30:00Z"
}
```

---

#### GET Single Broadcast
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_001
```

**Expected Response (200):**
```json
{
  "id": "broadcast_001",
  "stationId": "station_101",
  "title": "Weekend Diesel Special",
  "message": "Save 15¢/L on Diesel this weekend",
  "broadcastStatus": "scheduled",
  "views": 0,
  "clicks": 0
}
```

---

#### UPDATE Broadcast
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "message": "Updated message"
  }' \
  $API/broadcasts/broadcast_001
```

**Expected Response (200):**
```json
{
  "id": "broadcast_001",
  "title": "Updated Title",
  "message": "Updated message"
}
```

---

#### SAVE as Draft
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station_101",
    "title": "Draft Broadcast",
    "message": "This will be saved as draft",
    "targetRadiusKm": 10,
    "startDate": "2026-02-21T00:00:00Z",
    "endDate": "2026-02-23T23:59:59Z",
    "targetFuelTypes": "fuel_diesel"
  }' \
  $API/broadcasts/draft
```

**Expected Response (201):**
```json
{
  "id": "broadcast_002",
  "broadcastStatus": "draft"
}
```

---

#### SEND Broadcast (make it active)
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_001/send
```

**Expected Response (200):**
```json
{
  "id": "broadcast_001",
  "broadcastStatus": "active",
  "sentAt": "2026-02-17T10:30:00Z"
}
```

---

#### SCHEDULE Broadcast (for later)
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledFor": "2026-02-20T14:00:00Z"
  }' \
  $API/broadcasts/broadcast_001/schedule
```

**Expected Response (200):**
```json
{
  "id": "broadcast_001",
  "broadcastStatus": "scheduled",
  "scheduledFor": "2026-02-20T14:00:00Z"
}
```

---

#### CANCEL Scheduled Broadcast
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_001/cancel
```

**Expected Response (200):**
```json
{
  "id": "broadcast_001",
  "broadcastStatus": "cancelled"
}
```

---

#### DUPLICATE Broadcast
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_001/duplicate
```

**Expected Response (201):**
```json
{
  "id": "broadcast_003",
  "title": "Weekend Diesel Special (Copy)",
  "broadcastStatus": "draft"
}
```

---

#### DELETE Broadcast
```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_001
```

**Expected Response (204 No Content)**

---

#### GET Engagement Analytics
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/broadcast_001/engagement
```

**Expected Response (200):**
```json
[
  {
    "timestamp": "2026-02-17T10:00:00Z",
    "delivered": 234,
    "opened": 128,
    "clickedThrough": 42
  }
]
```

---

## Testing Error Scenarios

### 401 Unauthorized (Missing Token)
```bash
curl $API/broadcasts
```

**Expected Response (401):**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid token"
}
```

---

### 401 Unauthorized (Invalid Token)
```bash
curl -H "Authorization: Bearer invalid_token" \
  $API/broadcasts
```

**Expected Response (401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

---

### 404 Not Found
```bash
curl -H "Authorization: Bearer $TOKEN" \
  $API/broadcasts/nonexistent_id
```

**Expected Response (404):**
```json
{
  "error": "Not found",
  "message": "Broadcast not found"
}
```

---

### 400 Bad Request
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Missing required fields"
  }' \
  $API/broadcasts
```

**Expected Response (400):**
```json
{
  "error": "Bad request",
  "message": "Missing required field: stationId"
}
```

---

## Quick Testing Checklist

Use this to verify all endpoints:

```bash
# Set up
export TOKEN="your_token"
export API="http://api.gaspeep.com/api"

# ✓ Station Owner Endpoints
curl -H "Authorization: Bearer $TOKEN" $API/station-owners/profile
curl -H "Authorization: Bearer $TOKEN" $API/station-owners/stats
curl -H "Authorization: Bearer $TOKEN" $API/station-owners/fuel-prices
curl -H "Authorization: Bearer $TOKEN" $API/station-owners/stations

# ✓ Broadcast Endpoints
curl -H "Authorization: Bearer $TOKEN" $API/broadcasts
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"stationId":"s1","title":"Test","targetRadiusKm":10,"startDate":"2026-02-21T00:00:00Z","endDate":"2026-02-23T23:59:59Z","targetFuelTypes":"diesel"}' \
  $API/broadcasts

# ✓ Error Handling
curl $API/broadcasts  # Should return 401
curl -H "Authorization: Bearer $TOKEN" $API/broadcasts/fake  # Should return 404
```

---

## Troubleshooting

### "Connection refused"
- Verify backend is running: `docker compose ps`
- Check API URL is correct
- Try: `curl https://api.gaspeep.com/health`

### "Unauthorized" error
- Token may have expired
- Get a new token and try again
- Make sure Bearer token is included in header

### "Not found" error
- Station/broadcast ID may not exist
- Create a new resource first
- Check the ID format is correct

### "Bad request" error
- Check JSON format is valid
- Verify all required fields are present
- Check date format (use ISO 8601: `YYYY-MM-DDTHH:mm:ssZ`)

---

**Last Updated:** 2026-02-17
