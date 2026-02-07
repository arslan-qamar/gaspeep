# Station Owner Dashboard

## Section Description

This section provides station owners with tools to verify their ownership, manage their station profile, and broadcast promotional messages to nearby Premium users. Station owners can claim their stations through a verification process, update station information, create special offers and promotions, and target broadcasts to users within a defined radius.

The dashboard enables station owners to engage with the Gas Peep community by sharing price drops, special discounts, fuel quality certifications, and time-limited promotions. All broadcasts are delivered as push notifications to Premium users who have alerts set for nearby stations or who are actively browsing the area.

---

## Screen Designs

### 1. StationOwnerDashboardScreen

**Purpose:** Main dashboard showing station owner's claimed stations, recent broadcasts, and quick actions.

**Components:**
- Page header: "Station Owner Dashboard"
- Station owner welcome banner:
  - Owner name/business name
  - Verification status badge (Verified, Pending, Not Verified)
  - "Account Settings" link
- "My Stations" section:
  - Cards for each claimed station showing:
    - Station name and address
    - Brand logo/icon
    - Verification status
    - Last broadcast date
    - Quick actions: "Broadcast Offer", "Edit Station", "View Analytics"
  - "Claim New Station" button
- Empty state for no claimed stations:
  - Illustration of station pin
  - "No stations yet" heading
  - "Claim your first station to start broadcasting offers"
  - "Claim Station" button
- "Recent Broadcasts" section:
  - List of recent promotional messages:
    - Broadcast title
    - Station name
    - Timestamp
    - Recipient count (e.g., "Sent to 234 users")
    - Status (Active, Scheduled, Expired)
    - Quick actions: "View", "Edit", "Duplicate"
  - "Create Broadcast" button
- Statistics cards:
  - Total stations claimed
  - Active broadcasts
  - Total reach (users notified this month)
  - Engagement rate (notifications opened)

**States:**
- Unverified owner: Limited access with verification prompt
- Verified owner with no stations: Empty state with claim station CTA
- Verified owner with stations: Full dashboard view
- Loading: Skeleton loaders for stats and lists

**Verification Requirements:**
- If not verified, banner prompts: "Verify your station ownership"
- Link to verification process
- Limited broadcast capabilities until verified

**Interactions:**
- Click station card to view station details
- "Broadcast Offer" opens CreateBroadcastScreen with station pre-selected
- "Edit Station" opens StationDetailsScreen
- "Claim New Station" opens ClaimStationScreen
- Click broadcast to view details or edit
- Pull-to-refresh to update statistics

**Data Requirements:**
- Station owner profile and verification status
- List of claimed stations with status
- Recent broadcasts with engagement metrics
- Summary statistics

---

### 2. ClaimStationScreen

**Purpose:** Allow station owners to claim ownership of a fuel station through a verification process.

**Components:**
- Page header: "Claim Station"
- Step indicator (Step 1 of 3: Find → Verify → Confirm)

**Step 1: Find Station**
- Section heading: "Find Your Station"
- Search options:
  - Text search input for station name or address
  - Map view toggle
  - "Use Current Location" button
- Search results list:
  - Station cards showing name, address, brand
  - Distance from current location
  - Current claim status (Available, Claimed, Pending)
  - "Select This Station" button
- Already claimed indicator:
  - If station is claimed: "This station is already claimed"
  - Link to dispute process
- Empty state: "Station not found? Submit a request to add it"

**Step 2: Verify Ownership**
- Section heading: "Verify Ownership"
- Selected station summary card
- Verification methods:
  - **Business Document Upload**:
    - File upload area (drag & drop or browse)
    - Accepted documents: Business license, lease agreement, proof of ownership
    - Document guidelines
  - **Phone Verification**:
    - "Call from station landline" option
    - Display verification code to read during call
    - Automated system verifies caller ID matches station
  - **Email Verification**:
    - Email input for official station/brand email
    - Verification link sent to email
- Instructions for each method
- "Submit for Verification" button

**Step 3: Confirmation**
- Success message: "Verification request submitted"
- Expected timeline (e.g., "We'll review within 2-3 business days")
- Verification request ID for reference
- Next steps:
  - Email notification when approved
  - What to do while waiting
  - Contact support link
- "Return to Dashboard" button

**States:**
- Searching: Display search results
- Station selected: Move to verification step
- Uploading documents: Progress indicator
- Submitted: Confirmation screen
- Error: Display error message with retry option

**Interactions:**
- Search updates results dynamically
- Select station moves to verification
- Upload documents shows preview
- Submit triggers verification workflow
- Return to dashboard after confirmation

**Data Requirements:**
- Available stations to claim
- Current claim status for each station
- Verification method options
- Document upload capability

---

### 3. CreateBroadcastScreen

**Purpose:** Create promotional broadcast messages to send to nearby Premium users.

**Components:**
- Page header: "Create Broadcast"
- Form sections:

**Station Selection**
- Dropdown: "Select Station" (if owner has multiple)
- Selected station card with name, address
- Broadcast from this location indicator

**Message Composition**
- Title input (required):
  - Character limit: 50 characters
  - Placeholder: "Special offer today!"
  - Live character counter
- Message textarea (required):
  - Character limit: 280 characters
  - Placeholder: "Describe your promotion..."
  - Live character counter
  - Preview as notification card
- Promotion type selector:
  - Radio options: "Price Drop", "Special Discount", "Limited Time Offer", "New Service", "General Announcement"
  - Icon displayed for each type
- Fuel type tags (optional):
  - Multi-select checkboxes
  - Highlight which fuel types the offer applies to
  - Visual fuel badges

**Targeting Options**
- Radius slider:
  - Range: 1km to 25km
  - Visual map showing coverage area
  - Estimated recipient count (e.g., "~150 Premium users")
- Time scheduling:
  - "Send now" (default)
  - "Schedule for later" with date/time picker
  - Max 7 days in advance
- Duration selector:
  - How long the promotion is valid
  - Options: 1 hour, 4 hours, 24 hours, 3 days, 7 days, Custom
  - Expiry timestamp displayed

**Preview Section**
- Live preview of notification:
  - How it appears on user's device
  - Title, message, fuel types, expiry time
  - Station name and distance
- "Preview as User" button to see full experience

**Broadcast Limits & Rules**
- Display remaining broadcasts for current period
  - e.g., "3 of 10 broadcasts remaining this week"
- Premium plan limits notice if applicable
- Guidelines reminder:
  - "Keep messages promotional and relevant"
  - Link to broadcast policy

**Action Buttons**
- "Save as Draft" button
- "Send Broadcast" primary button (or "Schedule Broadcast")
- "Cancel" button with unsaved changes warning

**States:**
- Composing: Active form with live preview
- Validating: Check message length, targeting, etc.
- Scheduled: Confirmation that broadcast is scheduled
- Sent: Confirmation with delivery stats
- Error: Display error messages (e.g., limit reached, targeting error)

**Validation:**
- Title and message required
- Character limits enforced
- At least one station selected
- Valid radius and recipient count
- Schedule time in future (if scheduling)

**Interactions:**
- Type title/message to see live preview update
- Select promotion type updates preview icon
- Adjust radius slider shows updated recipient count
- Schedule toggle reveals date/time picker
- Preview button shows full notification mockup
- Send triggers confirmation dialog
- Success shows confirmation screen with reach stats

**Data Requirements:**
- Station owner's claimed stations
- Estimated Premium user count in radius
- Current broadcast limits and usage
- Fuel types for tagging
- Broadcast scheduling system

---

### 4. BroadcastDetailsScreen

**Purpose:** View details and analytics for a sent or scheduled broadcast.

**Components:**
- Page header with broadcast title
- Status badge (Active, Scheduled, Expired, Draft)
- Broadcast details card:
  - Station name and location
  - Creation date and scheduled/sent time
  - Promotion type icon and label
  - Expiry date/time
  - Targeted fuel types (if specified)
  - Full message text
- Targeting summary:
  - Radius used
  - Map showing coverage area
  - Recipient count
- Engagement metrics (for sent broadcasts):
  - Total recipients
  - Notifications delivered
  - Notifications opened (with percentage)
  - Click-throughs to station details
  - Engagement timeline chart (hourly breakdown)
- Actions:
  - "Edit" button (for drafts or scheduled)
  - "Duplicate Broadcast" button
  - "Delete" button (with confirmation)
  - "Cancel Broadcast" button (for scheduled)

**States:**
- Draft: Editable with "Continue Editing" CTA
- Scheduled: Show scheduled time with cancel option
- Active: Show real-time engagement metrics
- Expired: Show final engagement summary
- Loading: Skeleton loaders for metrics

**Interactions:**
- Edit opens CreateBroadcastScreen with prefilled data
- Duplicate creates new broadcast with same content
- Delete shows confirmation dialog
- Cancel scheduled broadcast requires confirmation
- View map shows full coverage visualization

**Data Requirements:**
- Broadcast content and metadata
- Targeting parameters
- Delivery and engagement metrics
- Station information

---

### 5. StationDetailsScreen

**Purpose:** View and edit claimed station information, verification status, and operational details.

**Components:**
- Page header: Station name
- Verification status banner:
  - "Verified" badge with checkmark (green)
  - Or "Pending Verification" with clock icon (yellow)
  - Verification date
  - Re-verification option (annual requirement)
- Station information card:
  - Name (editable)
  - Brand/logo
  - Full address (editable)
  - Geographic coordinates (map view)
  - Operating hours (editable):
    - Daily schedule grid
    - 24-hour toggle
    - Holiday hours option
  - Contact information:
    - Phone number
    - Website URL
    - Email
  - Amenities (editable checkboxes):
    - Car wash
    - Convenience store
    - Restrooms
    - Air pump
    - EV charging
    - Truck access
    - Loyalty program
- Current fuel prices display:
  - List of fuel types with current prices
  - Last updated timestamp
  - "Report Incorrect Price" link for users
  - Note: "Prices are community-submitted"
- Station photos gallery:
  - Thumbnail grid
  - Upload photos button
  - Guidelines for acceptable photos
- Broadcast history:
  - List of recent broadcasts from this station
  - Link to full broadcast analytics
- Action buttons:
  - "Save Changes" (if edited)
  - "Broadcast Offer" (quick access)
  - "Unclaim Station" (with confirmation warning)

**States:**
- Viewing: Read-only display of station info
- Editing: Form fields active with save/cancel
- Uploading: Progress indicator for photos
- Saving: Loading state with success/error feedback

**Interactions:**
- Edit mode enables form fields
- Operating hours grid allows daily schedule customization
- Amenities checkboxes toggle on/off
- Photo upload with preview
- Map picker for adjusting coordinates
- Save validates and updates station information
- Unclaim requires confirmation dialog with consequences

**Data Requirements:**
- Complete station information
- Verification status and history
- Current fuel prices (read-only from community)
- Station photos
- Broadcast history for this station

---

## User Flows

### Station Owner Onboarding
1. User creates account and selects "I'm a station owner" during registration
2. Directed to ClaimStationScreen
3. Searches for and selects their station
4. Chooses verification method and submits documentation
5. Waits for verification (receives email notification)
6. Once verified, gains access to StationOwnerDashboardScreen
7. Can immediately create broadcasts or manage station details

### Creating a Promotion
1. From dashboard, clicks "Broadcast Offer" on a station card
2. Taken to CreateBroadcastScreen with station pre-selected
3. Composes title and message
4. Selects promotion type and fuel types
5. Adjusts targeting radius and views recipient count
6. Previews notification appearance
7. Sends broadcast or schedules for later
8. Receives confirmation with delivery stats
9. Can view engagement metrics on BroadcastDetailsScreen

### Managing Stations
1. From dashboard, clicks "Edit Station" on a station card
2. Taken to StationDetailsScreen
3. Updates operating hours, amenities, contact info
4. Uploads station photos
5. Saves changes
6. Returns to dashboard to see updated station info

### Handling Multiple Stations
1. Owner with chain of stations claims each location
2. Dashboard shows all stations in "My Stations" section
3. When creating broadcast, selects which station(s) to broadcast from
4. Can view aggregated statistics across all stations
5. Can filter broadcasts by station

---

## Edge Cases & Error Handling

### Verification Failures
- Document rejected: Clear explanation of why, link to resubmit
- Phone verification fails: Alternative methods suggested
- Email not recognized: Manual review option

### Broadcast Limits
- Weekly broadcast limit reached: Display limit reset date
- Option to upgrade plan for more broadcasts
- Queued broadcasts may be delayed if limit reached

### Station Already Claimed
- User tries to claim already-claimed station
- Dispute process available with documentation
- Support contact for fraudulent claims

### Expired or Invalid Broadcasts
- Cannot edit expired broadcasts
- Scheduled broadcasts can be cancelled before send time
- Duplicate expired broadcasts to create new ones

### Multiple Stations, Same Location
- Some brands have multiple stations at one address
- Search results clearly differentiate by brand/name
- Address precision to avoid confusion

### Broadcast Delivery Issues
- No recipients in radius: Warning before sending
- Network errors: Retry mechanism with user notification
- Scheduled broadcast time passed: Automatic cancellation with alert

---

## Premium Integration

### Recipient Targeting
- Broadcasts only delivered to Premium users
- Targeting based on:
  - Users with alerts in the broadcast radius
  - Users actively browsing map in the area
  - Users who recently viewed the station
- Estimated reach shown before sending

### Station Owner Plans
- Basic: 5 broadcasts per week, 10km max radius
- Premium: 20 broadcasts per week, 25km max radius, analytics
- Enterprise: Unlimited broadcasts, custom radius, advanced analytics
- Plan comparison visible in dashboard

### Notification Preferences
- Premium users can opt-out of promotional broadcasts
- Can filter by promotion types (price drops only, etc.)
- Distance preferences honored

---

## Technical Considerations

### Verification Workflow
- Document upload: Secure storage, privacy compliance
- Automated verification where possible (phone, email)
- Manual review queue for documents
- Re-verification annually for security

### Broadcast Delivery System
- Push notification infrastructure
- Scheduling system for delayed broadcasts
- Geofencing to determine recipients
- Rate limiting to prevent spam

### Analytics & Metrics
- Track notification delivery, opens, engagement
- Real-time updates for active broadcasts
- Historical data retention
- Aggregated statistics for multi-station owners

### Fraud Prevention
- Verification required before broadcasting
- Broadcast content moderation (automated + manual)
- User reporting for inappropriate broadcasts
- Account suspension for policy violations

---

## Future Enhancements

- **Broadcast Templates**: Pre-designed message templates for common promotions
- **A/B Testing**: Test different messages to optimize engagement
- **Loyalty Integration**: Connect broadcasts to loyalty program rewards
- **Advanced Analytics**: Heat maps, demographic insights, competitor comparisons
- **Multi-Station Broadcasts**: Send same message to all owned stations at once
- **Automated Price Drop Alerts**: Auto-broadcast when station lowers prices
- **Community Feedback**: Ratings and responses to broadcasts
- **Broadcast Calendar**: Visual calendar of all scheduled broadcasts
