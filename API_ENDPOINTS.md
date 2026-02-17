# Station Owner Dashboard - API Endpoints Reference

## Base URL
```
Development: https://api.gaspeep.com
Production: https://api.gaspeep.com
```

## Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer {token}
```

---

## Station Owner Endpoints

### 1. Get Owner Profile
**Endpoint:** `GET /api/station-owners/profile`

**Response (200 OK):**
```json
{
  "id": "owner_001",
  "userId": "user_501",
  "businessName": "Coastal Fuel Group",
  "contactName": "Sarah Mitchell",
  "email": "sarah@coastalfuel.com.au",
  "phone": "+61 2 9555 1234",
  "verificationStatus": "verified",
  "verifiedAt": "2025-11-20T10:15:00Z",
  "plan": "premium",
  "broadcastsThisWeek": 7,
  "broadcastLimit": 20,
  "accountCreatedAt": "2025-11-15T09:00:00Z"
}
```

---

### 2. Get Dashboard Statistics
**Endpoint:** `GET /api/station-owners/stats`

**Response (200 OK):**
```json
{
  "totalStations": 3,
  "verifiedStations": 2,
  "activeBroadcasts": 2,
  "totalReachThisMonth": 5234,
  "averageEngagementRate": 0.28,
  "broadcastsThisWeek": 5,
  "broadcastLimit": 20
}
```

---

### 3. Get Owner's Fuel Prices
**Endpoint:** `GET /api/station-owners/fuel-prices`

**Response (200 OK):**
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
        "lastUpdated": "2026-02-17T08:30:00Z",
        "verificationStatus": "verified"
      }
    ],
    "station_102": [
      {
        "fuelTypeId": "fuel_unleaded_91",
        "fuelTypeName": "Unleaded 91",
        "price": 2.21,
        "currency": "AUD",
        "lastUpdated": "2026-02-16T14:15:00Z",
        "verificationStatus": "verified"
      }
    ]
  }
}
```

---

### 4. List Owned Stations
**Endpoint:** `GET /api/station-owners/stations`

**Response (200 OK):**
```json
[
  {
    "id": "station_101",
    "name": "Coastal Shell Station",
    "brand": "Shell",
    "address": "123 Main Street, Sydney NSW 2000",
    "latitude": -33.8688,
    "longitude": 151.2093,
    "operatingHours": "24/7",
    "amenities": ["WiFi", "Shop", "Toilets", "Pump&Pay"],
    "lastVerifiedAt": "2025-11-20T10:15:00Z"
  }
]
```

---

### 5. Get Station Details with Prices
**Endpoint:** `GET /api/station-owners/stations/:id`

**Response (200 OK):**
```json
{
  "id": "station_101",
  "name": "Coastal Shell Station",
  "brand": "Shell",
  "address": "123 Main Street, Sydney NSW 2000",
  "latitude": -33.8688,
  "longitude": 151.2093,
  "operatingHours": "24/7",
  "amenities": ["WiFi", "Shop", "Toilets", "Pump&Pay"],
  "lastVerifiedAt": "2025-11-20T10:15:00Z",
  "fuelPrices": [
    {
      "fuelTypeId": "fuel_unleaded_91",
      "fuelTypeName": "Unleaded 91",
      "price": 2.19,
      "currency": "AUD",
      "lastUpdated": "2026-02-17T08:30:00Z",
      "verificationStatus": "verified"
    }
  ]
}
```

---

### 6. Update Station Details
**Endpoint:** `PUT /api/station-owners/stations/:id`

**Request Body:**
```json
{
  "name": "Updated Station Name",
  "operatingHours": "6:00-23:00",
  "amenities": ["WiFi", "Shop", "Toilets"]
}
```

**Response (200 OK):**
```json
{
  "id": "station_101",
  "name": "Updated Station Name",
  "operatingHours": "6:00-23:00",
  "amenities": ["WiFi", "Shop", "Toilets"]
}
```

---

### 7. Search Available Stations to Claim
**Endpoint:** `GET /api/station-owners/search-stations?query=Shell&lat=-33.8688&lon=151.2093&radius=5`

**Query Parameters:**
- `query` - Station name or brand to search for
- `lat` - User latitude
- `lon` - User longitude
- `radius` - Search radius in kilometers

**Response (200 OK):**
```json
[
  {
    "id": "station_201",
    "name": "Shell Station - Parramatta",
    "brand": "Shell",
    "address": "456 Church Street, Parramatta NSW 2150",
    "latitude": -33.8194,
    "longitude": 151.0016,
    "operatingHours": "24/7",
    "distanceKm": 4.2
  }
]
```

---

### 8. Claim a Station
**Endpoint:** `POST /api/station-owners/claim-station`

**Request Body:**
```json
{
  "stationId": "station_201",
  "verificationMethod": "document",
  "documentUrls": [
    "https://s3.amazonaws.com/documents/business_license.pdf"
  ],
  "phoneNumber": "+61 2 9555 1234",
  "email": "sarah@coastalfuel.com.au"
}
```

**Response (201 Created):**
```json
{
  "claimId": "claim_001",
  "stationId": "station_201",
  "verificationStatus": "pending",
  "verificationMethod": "document",
  "createdAt": "2026-02-17T10:30:00Z"
}
```

---

### 9. Upload Station Photos
**Endpoint:** `POST /api/station-owners/stations/:id/photos`

**Request Body (multipart/form-data):**
```
photos: [file1.jpg, file2.jpg]
photoTypes: ["exterior", "pump"]
```

**Response (200 OK):**
```json
{
  "photoUrls": [
    "https://s3.amazonaws.com/photos/station_101/exterior.jpg",
    "https://s3.amazonaws.com/photos/station_101/pump.jpg"
  ]
}
```

---

### 10. Re-verify Station (Annual)
**Endpoint:** `POST /api/station-owners/stations/:id/reverify`

**Request Body:**
```json
{
  "verificationMethod": "document",
  "documentUrls": [
    "https://s3.amazonaws.com/documents/renewal_license.pdf"
  ]
}
```

**Response (200 OK):**
```json
{
  "stationId": "station_101",
  "verificationStatus": "pending",
  "renewalStartedAt": "2026-02-17T10:30:00Z"
}
```

---

### 11. Unclaim Station
**Endpoint:** `POST /api/station-owners/stations/:id/unclaim`

**Response (204 No Content)**

---

## Broadcast Endpoints

### 12. Create Broadcast
**Endpoint:** `POST /api/broadcasts`

**Request Body:**
```json
{
  "stationId": "station_101",
  "title": "Weekend Diesel Special!",
  "message": "Save 15¢/L on Diesel this weekend",
  "promotionType": "special_discount",
  "fuelTypes": ["fuel_diesel"],
  "targetRadius": 10,
  "scheduledFor": null,
  "expiresAt": "2026-02-09T22:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "id": "broadcast_001",
  "stationId": "station_101",
  "title": "Weekend Diesel Special!",
  "message": "Save 15¢/L on Diesel this weekend",
  "broadcastStatus": "draft",
  "targetRadiusKm": 10,
  "startDate": "2026-02-07T00:00:00Z",
  "endDate": "2026-02-09T22:00:00Z",
  "targetFuelTypes": ["fuel_diesel"],
  "createdAt": "2026-02-17T10:30:00Z"
}
```

---

### 13. Get All Broadcasts
**Endpoint:** `GET /api/broadcasts`

**Response (200 OK):**
```json
[
  {
    "id": "broadcast_001",
    "stationId": "station_101",
    "title": "Weekend Diesel Special!",
    "broadcastStatus": "active",
    "views": 234,
    "clicks": 42,
    "createdAt": "2026-02-17T10:30:00Z"
  }
]
```

---

### 14. Get Single Broadcast
**Endpoint:** `GET /api/broadcasts/:id`

**Response (200 OK):**
```json
{
  "id": "broadcast_001",
  "stationId": "station_101",
  "title": "Weekend Diesel Special!",
  "message": "Save 15¢/L on Diesel this weekend",
  "broadcastStatus": "active",
  "targetRadiusKm": 10,
  "startDate": "2026-02-07T00:00:00Z",
  "endDate": "2026-02-09T22:00:00Z",
  "views": 234,
  "clicks": 42,
  "createdAt": "2026-02-17T10:30:00Z"
}
```

---

### 15. Update Broadcast
**Endpoint:** `PUT /api/broadcasts/:id`

**Request Body:**
```json
{
  "title": "Updated Weekend Special",
  "message": "Now 20¢/L off Diesel"
}
```

**Response (200 OK):**
```json
{
  "id": "broadcast_001",
  "title": "Updated Weekend Special",
  "message": "Now 20¢/L off Diesel"
}
```

---

### 16. Save as Draft
**Endpoint:** `POST /api/broadcasts/draft`

**Request Body:** (Same as Create)

**Response (201 Created):**
```json
{
  "id": "broadcast_002",
  "broadcastStatus": "draft"
}
```

---

### 17. Send Broadcast
**Endpoint:** `POST /api/broadcasts/:id/send`

**Response (200 OK):**
```json
{
  "id": "broadcast_001",
  "broadcastStatus": "active",
  "sentAt": "2026-02-17T10:30:00Z",
  "estimatedReach": 1234
}
```

---

### 18. Schedule Broadcast
**Endpoint:** `POST /api/broadcasts/:id/schedule`

**Request Body:**
```json
{
  "scheduledFor": "2026-02-20T14:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "id": "broadcast_001",
  "broadcastStatus": "scheduled",
  "scheduledFor": "2026-02-20T14:00:00Z"
}
```

---

### 19. Cancel Scheduled Broadcast
**Endpoint:** `POST /api/broadcasts/:id/cancel`

**Response (200 OK):**
```json
{
  "id": "broadcast_001",
  "broadcastStatus": "cancelled",
  "cancelledAt": "2026-02-17T10:30:00Z"
}
```

---

### 20. Delete Broadcast
**Endpoint:** `DELETE /api/broadcasts/:id`

**Response (204 No Content)**

---

### 21. Duplicate Broadcast
**Endpoint:** `POST /api/broadcasts/:id/duplicate`

**Response (201 Created):**
```json
{
  "id": "broadcast_003",
  "title": "Weekend Diesel Special! (Copy)",
  "broadcastStatus": "draft",
  "stationId": "station_101"
}
```

---

### 22. Get Broadcast Analytics
**Endpoint:** `GET /api/broadcasts/:id/engagement`

**Response (200 OK):**
```json
[
  {
    "timestamp": "2026-02-06T10:00:00Z",
    "delivered": 234,
    "opened": 128,
    "clickedThrough": 42,
    "unsubscribed": 5,
    "bounced": 2
  },
  {
    "timestamp": "2026-02-07T10:00:00Z",
    "delivered": 312,
    "opened": 187,
    "clickedThrough": 68,
    "unsubscribed": 8,
    "bounced": 3
  }
]
```

---

### 23. Estimate Recipients
**Endpoint:** `GET /api/broadcasts/estimate-recipients?stationId=station_101&radiusKm=10`

**Response (200 OK):**
```json
{
  "stationId": "station_101",
  "radiusKm": 10,
  "estimatedRecipients": 2847,
  "premiumUsers": 1234,
  "standardUsers": 1613
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "message": "Missing required field: stationId"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't own this station"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Broadcast not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Testing the API

### Using cURL
```bash
# Get profile (requires valid token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.gaspeep.com/api/station-owners/profile

# Create broadcast
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station_101",
    "title": "Test Broadcast",
    "targetRadius": 10
  }' \
  https://api.gaspeep.com/api/broadcasts
```

### Using Postman
1. Create a Postman collection with these endpoints
2. Add Authorization header with Bearer token
3. Test each endpoint with sample data

---

## Implementation Status

### ✅ Fully Implemented
- GetProfile, GetStats, GetFuelPrices
- GetStations, GetStationDetails
- CreateBroadcast, GetBroadcasts, GetBroadcast
- UpdateBroadcast, DeleteBroadcast
- SendBroadcast, ScheduleBroadcast, CancelBroadcast
- DuplicateBroadcast

### 🟡 Partially Implemented
- SearchAvailableStations (needs owner_id migration applied)
- ClaimStation, UnclaimStation, ReVerifyStation
- SavePhotos, UploadPhotos

### 🔴 TODO
- GetEngagement (needs broadcast_analytics table)
- EstimateRecipients (needs premium user logic)

---

## Rate Limits
- 1000 requests per minute per user
- 100 broadcast creations per day
- 10 photo uploads per station per day

---

## Pagination
List endpoints support pagination:
```
GET /api/broadcasts?page=1&limit=20&sort=createdAt&order=desc
```

---

Last Updated: 2026-02-17
