# Handler Tests

Tests for HTTP request handlers organized by feature.

## Test Files

- **station_owner_profile_test.go** - Station owner profile endpoints
  - `TestGetProfileEndpoint` - GET /api/station-owners/profile

- **station_owner_stations_test.go** - Station listing and retrieval endpoints
  - `TestGetStationsEndpoint` - GET /api/station-owners/stations
  - `TestGetStationsEndpointEmpty` - Empty stations list scenario

- **broadcast_endpoints_test.go** - Broadcast management endpoints
  - `TestCreateBroadcastEndpoint` - POST /api/broadcasts
  - `TestGetBroadcastEndpoint` - GET /api/broadcasts/:id
  - `TestSendBroadcastEndpoint` - POST /api/broadcasts/:id/send
  - `TestScheduleBroadcastEndpoint` - POST /api/broadcasts/:id/schedule
  - `TestDeleteBroadcastEndpoint` - DELETE /api/broadcasts/:id

## Running Tests

```bash
# Run all handler tests
go test ./internal/handler/...

# Run specific test file
go test ./internal/handler/__tests__ -run StationOwner

# Run with verbose output
go test ./internal/handler/__tests__ -v
```
