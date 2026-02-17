# Station Claim Implementation

## Overview
Successfully implemented the complete station claim flow allowing users to:
1. Search for available stations
2. Select a station
3. Upload documents for ownership verification
4. Submit the claim for review

## Changes Made

### Frontend Implementation

#### 1. ClaimStationScreen Component Updates
**File:** `frontend/src/sections/station-owner-dashboard/ClaimStationScreen.tsx`

**Key Changes:**
- Added `onClaim` prop to accept the claim mutation function
- Added `claimError` prop to display error messages
- Updated `handleVerificationSubmit` to:
  - Convert uploaded files to data URLs
  - Call the `onClaim` mutation with station ID, verification method, and document URLs
  - Handle errors and display error banner
  - Show confirmation step on success
- Added error message display in the verify step
- Fixed TypeScript type issues (removed unused imports, fixed union types)

**Document Upload Flow:**
```typescript
1. User selects files via drag-drop or file input
2. Files stored in component state as File objects
3. On submit, files converted to data URLs using FileReader API
4. Data URLs passed to claimStation mutation
5. Backend receives and processes the verification request
```

#### 2. Router Integration
**File:** `frontend/src/lib/router.tsx`

**Key Changes:**
- Extract `claimStation`, `isClaimingStation`, `claimStationError` from the `useStationOwner` hook
- Pass the `claimStation` mutation callback to ClaimStationScreen
- Pass error and loading states for proper UI feedback
- Wire up the callback to handle claim submission:
  ```typescript
  onClaim={async (stationId, verificationMethod, documentUrls) => {
    await claimStation({
      stationId,
      verificationMethod,
      documentUrls,
    })
  }}
  ```

### Backend Implementation

#### 1. Repository Interface
**File:** `backend/internal/repository/station_owner_repository.go`

**Changes:**
- Added `ClaimStation` method signature to the interface:
  ```go
  ClaimStation(userID, stationID, verificationMethod string, documentUrls []string, phoneNumber, email string) (map[string]interface{}, error)
  ```

#### 2. PostgreSQL Repository Implementation
**File:** `backend/internal/repository/pg_station_owner_repository.go`

**Implementation Details:**
- Uses database transaction to ensure atomicity
- Creates or retrieves existing station_owner record for user
- Updates station.owner_id to link station to owner
- Sets station.verification_status to "pending"
- Creates claim_verification record with:
  - Verification method (document, phone, email)
  - Document URLs (stored as JSON array)
  - Phone number and email (optional)
  - Status set to "pending"
- Returns claim verification details

**Key SQL Operations:**
1. Get or create station_owner record
2. Update station ownership and status
3. Create claim verification record
4. All within a transaction for data integrity

#### 3. Service Layer
**File:** `backend/internal/service/station_owner_service.go`

**Change:**
- Implemented `SearchAvailableStations` method to delegate to repository

```go
func (s *stationOwnerService) ClaimStation(...) (map[string]interface{}, error) {
	return s.stationOwnerRepo.ClaimStation(...)
}
```

## Database Schema

### claim_verifications Table
- **id** (UUID): Primary key
- **station_id** (UUID): Reference to stations table
- **station_owner_id** (UUID): Reference to station_owners table
- **verification_method** (VARCHAR): 'document', 'phone', 'email'
- **verification_documents** (TEXT): JSON array of document URLs
- **phone_number** (VARCHAR): Optional phone for verification
- **email** (VARCHAR): Optional email for verification
- **verification_status** (VARCHAR): 'pending', 'approved', 'rejected'
- **created_at** (TIMESTAMP): Automatic timestamp
- **updated_at** (TIMESTAMP): Auto-update timestamp

### stations Table Updates
- **owner_id** (UUID, nullable): Links to station_owners
- **verification_status** (VARCHAR): 'unverified', 'pending', 'verified'

## API Flow

### Request
```
POST /api/station-owners/claim-station
Content-Type: application/json

{
  "stationId": "uuid",
  "verificationMethod": "document",
  "documentUrls": ["data:image/jpeg;base64,/9j/...", ...],
  "phoneNumber": "+1234567890",
  "email": "owner@example.com"
}
```

### Response
```json
{
  "id": "verification-request-id",
  "stationId": "station-id",
  "stationName": "Station Name",
  "ownerId": "owner-id",
  "verificationMethod": "document",
  "verificationStatus": "pending",
  "createdAt": "2025-02-17T10:30:00Z"
}
```

### Error Handling
- Missing required fields: 400 Bad Request
- Station not found: 404 Not Found
- Database errors: 500 Internal Server Error
- Unauthorized (not authenticated): 401 Unauthorized

## User Flow

### Step 1: Find Station
1. User navigates to "Claim Station"
2. Frontend automatically loads available stations (50km radius from default location)
3. User can search by name/address
4. User clicks "Select This Station"

### Step 2: Verify Ownership
1. Station details displayed for confirmation
2. User uploads documents (drag-drop or file selection)
3. Supported formats: PDF, JPG, PNG (max 10MB each)
4. User can remove documents before submitting
5. User clicks "Submit for Verification"
6. Frontend converts files to data URLs and calls API

### Step 3: Confirmation
1. Success message displayed with verification request ID
2. Information about review timeline (2-3 business days)
3. User can return to dashboard

## Error Scenarios

### Document Upload Failures
- **Too large file:** Browser validation (10MB limit)
- **Invalid format:** File type validation in upload area
- **Upload interrupted:** Users can retry by uploading again

### Claim Submission Failures
- **Network error:** Error banner displayed with retry button
- **Station already claimed:** Error message from backend
- **Verification failed:** Error details displayed to user

## Testing Considerations

### Frontend Testing
- Test file upload (single and multiple files)
- Test file removal
- Test form submission
- Test error display
- Test loading states
- Test navigation between steps

### Backend Testing
- Test transaction handling
- Test station not found error
- Test duplicate claim prevention
- Test document URL storage as JSON
- Test station_owner creation for new users
- Test station verification_status update

### Integration Testing
- Test complete claim flow end-to-end
- Test with various verification methods
- Test concurrent claims (edge case)
- Test database transaction rollback on error

## Performance Considerations

1. **Transaction Overhead**: Minimal - single transaction per claim
2. **Document Storage**: Base64 URLs stored in database (could move to S3 in future)
3. **Query Performance**: Indexed on station_id and station_owner_id
4. **Concurrent Claims**: Handled by database constraints

## Future Enhancements

1. **Document Upload to S3**: Move from base64 to S3 URLs for better scalability
2. **Email Notifications**: Notify owner when claim is approved/rejected
3. **Admin Dashboard**: Allow admins to review and approve claims
4. **Geolocation**: Use user's actual GPS location instead of hardcoded coordinates
5. **Document Preview**: Show thumbnails of uploaded documents
6. **Verification Status Dashboard**: Show users status of their claims
7. **Re-verification**: Annual re-verification of station ownership

## Verified Components

✅ Frontend ClaimStationScreen component updated
✅ Router integration with mutation callbacks
✅ Backend ClaimStation method implemented in repository
✅ Service layer delegates to repository
✅ Transaction handling for data consistency
✅ Error handling and messages
✅ TypeScript compilation (no errors)
✅ Backend compilation successful
✅ Database schema matches implementation

## Files Modified

### Frontend
- `frontend/src/sections/station-owner-dashboard/ClaimStationScreen.tsx`
- `frontend/src/lib/router.tsx`

### Backend
- `backend/internal/repository/station_owner_repository.go`
- `backend/internal/repository/pg_station_owner_repository.go`
- `backend/internal/service/station_owner_service.go`
