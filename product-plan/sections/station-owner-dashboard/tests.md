# Station Owner Dashboard — Test Specifications

## Dashboard Tests

### Flow 1: Dashboard Overview
**Given:** Verified station owner  
**When:** User views dashboard  
**Then:**
- [ ] Welcome banner shows owner name
- [ ] Verification status: "Verified"
- [ ] "My Stations" section shows all claimed stations
- [ ] "Recent Broadcasts" section shows last 5 broadcasts
- [ ] Statistics show: total stations, active broadcasts, total reach
- [ ] "Claim New Station" button visible
- [ ] "Create Broadcast" button visible

### Flow 2: Station Cards
**Given:** Station owner with 3 claimed stations  
**When:** Dashboard loads  
**Then:**
- [ ] Each station displays:
  - Station name and address
  - Brand logo
  - Verification status badge
  - Last broadcast date
  - Quick action buttons

### Flow 3: Broadcast History
**Given:** Owner with 10+ broadcasts  
**When:** User views Recent Broadcasts section  
**Then:**
- [ ] Shows last 5 broadcasts
- [ ] Can link to full history
- [ ] Each broadcast shows:
  - Title
  - Date created
  - Number of recipients
  - Status (Active, Scheduled, Expired)

## Station Claiming Flow

### Claim Flow 1: Find Station
**Given:** Unverified owner or no claimed stations  
**When:** User clicks "Claim Station"  
**Then:**
- [ ] ClaimStationScreen opens
- [ ] Step 1: Find Station shown
- [ ] Can search by name or address
- [ ] Search results appear
- [ ] Can select from map
- [ ] Selected station shows claim status

### Claim Flow 2: Verify Ownership
**Given:** Station selected  
**When:** Proceeding to Step 2  
**Then:**
- [ ] Document upload area appears
- [ ] Can upload business license, utility bill, etc.
- [ ] Instructions clear
- [ ] Multiple uploads allowed

### Claim Flow 3: Confirm & Complete
**Given:** Station and documents uploaded  
**When:** Proceeding to Step 3  
**Then:**
- [ ] Review screen shows all details
- [ ] Can confirm or go back to edit
- [ ] Submit creates claim
- [ ] "Pending verification" status shown
- [ ] Notification of claim submitted

### Claim Flow 4: Station Pending Verification
**Given:** Owner claimed station but not verified  
**When:** Viewing dashboard  
**Then:**
- [ ] Station shows with "Pending" badge
- [ ] Limited access (no broadcasts yet)
- [ ] Can check status or upload more docs

### Claim Flow 5: Verified Station
**Given:** Admin verified the station claim  
**When:** Owner logs back in  
**Then:**
- [ ] Station now shows "Verified" badge
- [ ] Full access to broadcast
- [ ] "Create Broadcast" button enabled

## Broadcast Creation

### Broadcast Flow 1: Create Broadcast
**Given:** Verified owner  
**When:** Clicks "Create Broadcast"  
**Then:**
- [ ] CreateBroadcastScreen opens
- [ ] Station dropdown pre-filled or selectable
- [ ] Title field for broadcast name
- [ ] Message field for offer text
- [ ] Character count shown (e.g., "245/500")
- [ ] Date/time pickers for start/end
- [ ] Radius slider (1-50 km)
- [ ] Optional: Fuel type filter

### Broadcast Flow 2: Fill In Details
**Given:** On create broadcast form  
**When:** User enters broadcast details  
**Then:**
- [ ] Title accepts input
- [ ] Message accepts multiline text
- [ ] Start/end dates set correctly
- [ ] Radius slider updates preview
- [ ] Can optionally filter by fuel types
- [ ] Form validation prevents empty fields

### Broadcast Flow 3: Schedule Broadcast
**Given:** Broadcast details entered  
**When:** Start date is in future  
**Then:**
- [ ] Broadcast status: "Scheduled"
- [ ] Shows when it will go live
- [ ] Can edit or delete before start time

### Broadcast Flow 4: Active Broadcast
**Given:** Broadcast start time reached  
**When:** Time passes to start date  
**Then:**
- [ ] Broadcast status: "Active"
- [ ] Notifications sent to nearby Premium users
- [ ] Can continue editing (optional)

### Broadcast Flow 5: Expired Broadcast
**Given:** Broadcast end time reached  
**When:** Time passes to end date  
**Then:**
- [ ] Broadcast status: "Expired"
- [ ] No more notifications sent
- [ ] Shows in history
- [ ] Can duplicate for new broadcast

### Broadcast Flow 6: Rate Limiting
**Given:** Owner trying to create 6th broadcast in one day  
**When:** Attempting to create  
**Then:**
- [ ] Error or warning: "Max 5 broadcasts per day"
- [ ] Can queue for next day
- [ ] Or defer creation

## Broadcast Management

### Management Flow 1: View Broadcast Details
**Given:** Broadcast in history  
**When:** User clicks broadcast  
**Then:**
- [ ] Full message displayed
- [ ] Station details shown
- [ ] Status indicator
- [ ] Engagement metrics:
  - Number of users notified
  - Number who opened notification
  - CTR (click-through rate)

### Management Flow 2: Edit Broadcast
**Given:** Scheduled broadcast  
**When:** User clicks "Edit"  
**Then:**
- [ ] EditBroadcastScreen opens
- [ ] Pre-fills with existing data
- [ ] Can modify any field
- [ ] Submit updates broadcast
- [ ] Changes reflected immediately

### Management Flow 3: Duplicate Broadcast
**Given:** Successful broadcast  
**When:** User clicks "Duplicate"  
**Then:**
- [ ] New form opens with same content
- [ ] Can modify for new broadcast
- [ ] Dates/times cleared (set new dates)
- [ ] Submit creates new broadcast

### Management Flow 4: Delete Broadcast
**Given:** Scheduled or expired broadcast  
**When:** User clicks "Delete"  
**Then:**
- [ ] Confirmation dialog
- [ ] "Are you sure?" message
- [ ] Cancel or Confirm
- [ ] Deleting removes from list

## Analytics Tests

### Analytics 1: Engagement Metrics
**Given:** Active or recent broadcasts  
**When:** Viewing broadcast details  
**Then:**
- [ ] Shows notification count sent
- [ ] Shows notification open count
- [ ] Shows click count (if tracked)
- [ ] Calculates engagement rate
- [ ] Compares to previous broadcasts

### Analytics 2: Station Performance
**Given:** Owner with multiple broadcasts  
**When:** Viewing station card  
**Then:**
- [ ] Shows total broadcasts for station
- [ ] Shows reach (total users notified)
- [ ] Shows average engagement rate

## Error State Tests

### Error 1: Station Already Claimed
**Given:** User trying to claim already-claimed station  
**When:** Selecting station  
**Then:**
- [ ] Warning: "This station is already claimed"
- [ ] Option to request dispute/takeover
- [ ] Cannot proceed

### Error 2: Verification Rejected
**Given:** Owner submitted verification but was rejected  
**When:** Logging back in  
**Then:**
- [ ] Station shows "Rejected" badge
- [ ] Reason displayed
- [ ] Option to resubmit with new docs

### Error 3: Broadcast Send Failed
**Given:** Broadcasting to users  
**When:** Notification service fails  
**Then:**
- [ ] Error logged
- [ ] User notified: "Failed to send broadcast. Retry?"
- [ ] Can retry sending

## Responsive Design Tests

- [ ] Dashboard cards responsive
- [ ] Station cards stack on mobile
- [ ] Broadcast form mobile-friendly
- [ ] Forms fit on smaller screens
- [ ] Touch targets adequate

## Dark Mode Tests

- [ ] Dashboard dark background
- [ ] Cards readable
- [ ] Forms dark background
- [ ] All text readable

## Success Criteria

✅ Dashboard displays all required info  
✅ Station claiming workflow complete  
✅ Broadcast creation and management working  
✅ Scheduling and expiration working  
✅ Analytics displayed  
✅ Rate limiting enforced  
✅ Error handling helpful  
✅ Responsive and dark mode working  
