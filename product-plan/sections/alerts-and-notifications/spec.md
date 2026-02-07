# Alerts & Notifications

## Section Description

This section provides Premium users with custom price alert functionality and a notification management system. Users can create location-based price threshold alerts for their preferred fuel types, receive real-time notifications when prices drop, and view promotional broadcasts from nearby station owners.

The alert system monitors fuel prices within a defined radius and triggers notifications when prices fall below the user's specified threshold. Users can manage multiple alerts, pause/resume them, and customize notification preferences. The notification center provides a unified view of all alerts, broadcasts, and system notifications with filtering and archival capabilities.

---

## Screen Designs

### 1. AlertsListScreen

**Purpose:** Display all user-configured alerts with quick status overview and management options.

**Components:**
- Page header: "Price Alerts"
- Premium badge indicator (if accessed from free tier, shows upgrade prompt)
- "Create Alert" primary button (prominent, top-right)
- Alert cards grid/list displaying:
  - Alert name/description
  - Fuel type badge with color
  - Price threshold (e.g., "≤ $1.85/L")
  - Location name or coordinates
  - Radius indicator (e.g., "Within 5km")
  - Active/paused status toggle
  - Last triggered timestamp (or "Never triggered")
  - Edit and delete action buttons
- Empty state for users with no alerts:
  - Illustration of notification bell
  - "No alerts yet" heading
  - "Create your first price alert to get notified when fuel prices drop"
  - "Create Alert" button
- Filter options:
  - Active/paused/all alerts
  - Fuel type filter
  - Sort by: recently triggered, price, location

**States:**
- Empty: No alerts configured (shows empty state)
- Populated: List of alerts with various statuses
- Loading: Skeleton loaders while fetching alerts
- Editing: Inline toggle for active/paused status

**Premium Gating:**
- Free users see locked state with upgrade prompt
- "Unlock custom alerts with Premium" message
- Feature comparison highlighting alert capabilities
- "Upgrade to Premium" CTA button

**Interactions:**
- Toggle alert active/paused status inline
- Click alert card to view alert details
- Edit button opens CreateAlertScreen in edit mode
- Delete button shows confirmation dialog
- Filter and sort options update list view
- Pull-to-refresh on mobile to check alert status
- Create Alert button navigates to CreateAlertScreen

**Data Requirements:**
- List of user's configured alerts
- Alert status (active, paused, triggered count)
- Associated fuel types and locations
- Last triggered timestamp
- User's Premium status

---

### 2. CreateAlertScreen

**Purpose:** Allow users to create or edit custom price threshold alerts with location and fuel type parameters.

**Components:**
- Page header: "Create Price Alert" or "Edit Alert"
- Step indicator (Step 1 of 3: Fuel Type → Location → Threshold)
- Back button to return to previous step or list

**Step 1: Fuel Type Selection**
- Section heading: "Select Fuel Type"
- Fuel type grid/cards:
  - Visual fuel type badges with colors
  - Fuel type names (E10, Unleaded 91, Diesel, etc.)
  - Current average price in area (informational)
- Single selection (radio button behavior)
- "Next" button to proceed

**Step 2: Location & Radius**
- Section heading: "Set Location"
- Location options:
  - "Current Location" button (uses GPS)
  - "Choose on Map" (opens map picker)
  - Manual address search input
- Selected location display:
  - Address or coordinates
  - "Change Location" button
- Radius slider:
  - Range: 1km to 50km
  - Visual indicator of coverage area on mini-map
  - Estimated station count within radius
- "Next" button to proceed

**Step 3: Price Threshold**
- Section heading: "Set Price Threshold"
- Current price context:
  - "Current average: $1.92/L in your area"
  - "Lowest nearby: $1.85/L at [Station Name]"
- Price input field:
  - Currency formatted
  - Per unit label ($/L)
  - Helper text: "You'll be notified when prices drop to or below this amount"
- Optional: Alert name/description input
  - Placeholder: "e.g., 'Work commute diesel'"
- Notification preference toggle:
  - Push notifications
  - Email notifications (if enabled in settings)
- "Create Alert" primary button
- Preview summary card showing all selections

**States:**
- Step 1 Active: Fuel type selection
- Step 2 Active: Location selection and radius
- Step 3 Active: Price threshold configuration
- Loading: Creating/updating alert
- Success: Confirmation message before returning to list
- Error: Validation errors or API failures

**Edit Mode:**
- Pre-filled with existing alert data
- "Update Alert" button instead of "Create"
- Option to duplicate alert with modifications

**Interactions:**
- Step-by-step wizard navigation
- Map interaction for location selection
- Real-time price context updates as user adjusts location/radius
- Form validation on each step
- Success toast notification on creation
- Auto-navigate back to AlertsListScreen on success

**Data Requirements:**
- Available fuel types
- User's current location
- Average and lowest prices by fuel type in area
- Station count within selected radius
- Existing alert data (if editing)

---

### 3. NotificationsScreen

**Purpose:** Unified notification center for all alert triggers, broadcasts, and system notifications.

**Components:**
- Page header: "Notifications"
- Tabs for filtering:
  - All
  - Alerts (price threshold triggered)
  - Broadcasts (station owner promotions)
  - System (account updates, moderation)
- Mark all as read button
- Notification list items:
  - **Alert Notification:**
    - Fuel type badge
    - "Price Alert: Diesel at $1.82/L" title
    - Station name and address
    - Distance from alert location
    - "Price dropped to $1.82/L (below your $1.85/L threshold)"
    - Timestamp (e.g., "2 hours ago")
    - Unread indicator (dot or highlight)
    - Actions: "View on Map", "Dismiss"
  - **Broadcast Notification:**
    - Station logo/icon
    - "Special Offer: [Station Name]" title
    - Promotional message content
    - Distance from user
    - Valid until timestamp
    - Unread indicator
    - Actions: "View Details", "Get Directions", "Dismiss"
  - **System Notification:**
    - System icon
    - Title (e.g., "Submission Approved")
    - Message content
    - Timestamp
    - Actions: "View", "Dismiss"
- Empty state:
  - Notification bell illustration
  - "No notifications yet"
  - "You'll see price alerts and station offers here"
- Settings button (opens notification preferences)

**States:**
- Empty: No notifications (shows empty state)
- Populated: List of notifications with various types
- Loading: Skeleton loaders while fetching
- Filtered: Tab-specific notification list

**Notification Grouping:**
- Group multiple alerts for same location/fuel type
- "3 new price alerts in your area" collapsed card
- Expand to see individual notifications

**Interactions:**
- Swipe to dismiss on mobile
- Tap notification to view details
- "View on Map" opens MapScreen with station highlighted
- "Get Directions" opens device navigation app
- Mark as read on tap
- Mark all as read button
- Pull-to-refresh for new notifications
- Filter by tabs
- Settings button opens notification preferences dialog

**Data Requirements:**
- List of notifications with types
- Read/unread status
- Associated alert or broadcast data
- Timestamp and expiry information
- User's current location for distance calculations

---

### 4. AlertDetailScreen

**Purpose:** Display detailed alert configuration and trigger history for a specific alert.

**Components:**
- Page header with alert name/description
- Back button to AlertsListScreen
- Edit and delete action buttons
- Active/paused status toggle (prominent)
- Alert summary card:
  - Fuel type with badge
  - Price threshold
  - Location and radius map preview
  - Created date
  - Notification preferences
- Statistics section:
  - Times triggered count
  - Last triggered timestamp
  - Average savings estimate (if triggered)
  - Stations currently matching threshold (real-time)
- Trigger history list:
  - Chronological list of past triggers
  - Each item shows:
    - Station name and location
    - Price at time of trigger
    - Timestamp
    - "View on Map" link
  - Paginated or "Load More" button
- Empty trigger history:
  - "No triggers yet"
  - "You'll see a history of price drops here once your alert is triggered"
- Quick actions:
  - "Edit Alert" button
  - "Duplicate Alert" button
  - "Pause/Resume Alert" toggle
  - "Delete Alert" button (with confirmation)

**States:**
- Active alert view with current status
- Paused alert view with resume option
- Loading: Fetching alert details and history
- No trigger history (empty state)

**Real-time Status:**
- "Currently X stations match your threshold"
- List of matching stations (top 3-5)
- "View all on map" link

**Interactions:**
- Toggle active/paused status
- Edit button navigates to CreateAlertScreen with pre-filled data
- Duplicate creates new alert with same parameters
- Delete shows confirmation dialog
- Trigger history items link to map view
- View matching stations opens map with filtered results

**Data Requirements:**
- Alert configuration details
- Trigger history with timestamps and prices
- Current stations matching threshold
- Alert statistics and metrics
- User's current location

---

### 5. NotificationSettingsDialog

**Purpose:** Configure notification delivery preferences and alert behavior settings.

**Components:**
- Dialog/modal header: "Notification Settings"
- Close button
- Settings sections:

**Delivery Methods:**
- Push Notifications toggle
  - Enable/disable push notifications
  - Note: "Required for real-time alerts"
- Email Notifications toggle
  - Enable/disable email notifications
  - Frequency dropdown: "Immediately", "Daily digest", "Weekly digest"
- SMS Notifications toggle (if supported)
  - Enable/disable SMS
  - Phone number input

**Alert Preferences:**
- Quiet hours toggle
  - Enable quiet hours
  - Time range picker (e.g., 10 PM - 7 AM)
  - "Don't send notifications during these hours"
- Alert frequency limits:
  - "Maximum alerts per day" dropdown
  - Options: 1, 3, 5, 10, Unlimited
  - Prevents notification fatigue
- Minimum price drop percentage:
  - Slider: 1% to 20%
  - "Only notify if price drops by at least this percentage"

**Broadcast Preferences:**
- Station broadcasts toggle
  - Enable/disable promotional broadcasts
  - "Receive special offers from nearby stations"
- Maximum distance for broadcasts:
  - Dropdown: 1km, 5km, 10km, 25km
  - "Only show broadcasts from stations within this range"

**System Notifications:**
- Account updates toggle
- Submission status toggle
- Feature announcements toggle

- "Save Preferences" primary button
- "Reset to Defaults" secondary button

**States:**
- Default: Current preferences displayed
- Editing: User modifying settings
- Saving: Preferences being updated
- Success: Confirmation toast on save

**Interactions:**
- Toggle switches for enable/disable
- Time pickers for quiet hours
- Dropdown selections for frequencies and distances
- Slider for minimum price drop
- Save button updates preferences
- Reset button shows confirmation dialog

**Data Requirements:**
- Current notification preferences
- User's contact information (email, phone)
- Device notification permissions status
- Default preference values

---

## Key Interactions & Flows

### Creating an Alert
1. User navigates to AlertsListScreen
2. Taps "Create Alert" button
3. Step 1: Selects fuel type (e.g., Diesel)
4. Taps "Next"
5. Step 2: Sets location (current location or manual)
6. Adjusts radius slider (e.g., 10km)
7. Sees estimated station count update
8. Taps "Next"
9. Step 3: Views current price context
10. Enters price threshold (e.g., $1.85/L)
11. Optionally names alert
12. Taps "Create Alert"
13. Sees success message
14. Returns to AlertsListScreen with new alert visible

### Receiving a Price Alert
1. Alert monitoring detects price drop
2. Push notification sent to user's device
3. User taps notification
4. App opens to NotificationsScreen
5. Alert notification expanded with details
6. User taps "View on Map"
7. MapScreen opens with station highlighted
8. User can navigate to station or submit verification

### Managing Notifications
1. User navigates to NotificationsScreen
2. Sees mixed list of alerts, broadcasts, system notifications
3. Taps "Alerts" tab to filter
4. Swipes to dismiss individual notifications
5. Taps "Mark all as read"
6. Notifications visually update to read state

### Configuring Notification Preferences
1. User opens NotificationSettingsDialog
2. Enables quiet hours toggle
3. Sets quiet hours: 10 PM - 7 AM
4. Adjusts "Maximum alerts per day" to 5
5. Sets minimum price drop to 5%
6. Taps "Save Preferences"
7. Sees confirmation toast
8. Dialog closes

---

## Design Considerations

### Premium Feature Access
- Alerts are Premium-only functionality
- Free users see locked state with clear upgrade path
- Feature comparison highlights value proposition
- Seamless upgrade flow from alert screens

### Location Privacy
- Users control location sharing per alert
- Option to use address instead of GPS
- Clear indication of location data usage
- Ability to delete location data with alert

### Notification Management
- Anti-spam measures: frequency limits
- User control over notification types
- Quiet hours respect user boundaries
- Easy bulk actions (mark all read, dismiss all)

### Real-time Updates
- Alert status reflects current price data
- "X stations match your threshold" updates live
- Push notifications with minimal latency
- Background monitoring for active alerts

### Accessibility
- Clear visual indicators for notification status
- Screen reader support for all interactive elements
- Haptic feedback for important notifications
- Adjustable text sizes

### Performance
- Efficient geospatial queries for alert monitoring
- Notification queuing and batching
- Background task optimization
- Low battery impact

---

## Data Requirements Summary

### User Data
- Premium subscription status
- Notification preferences (push, email, SMS)
- Quiet hours configuration
- Device tokens for push notifications
- Current location (with permission)

### Alert Data
- Alert configuration (fuel type, location, radius, threshold)
- Active/paused status
- Created and last modified timestamps
- Trigger history (timestamps, stations, prices)
- Alert statistics (trigger count, savings)

### Notification Data
- Notification type (alert, broadcast, system)
- Content (title, message, associated data)
- Sent and read timestamps
- Delivery status
- Expiry timestamps (for broadcasts)

### Station & Price Data
- Station locations within alert radii
- Current fuel prices by type
- Price change history
- Station owner broadcast messages

### Context Data
- Average prices by fuel type and region
- Lowest prices within radius
- Station count within radius
- Distance calculations from user/alert location

---

## Technical Considerations

### Alert Monitoring Service
- Background job processing for active alerts
- Efficient geospatial queries (PostGIS)
- Price change detection with configurable thresholds
- Alert triggering logic with cooldown periods
- Notification queue management

### Push Notification Infrastructure
- Firebase Cloud Messaging (Android)
- Apple Push Notification Service (iOS)
- Web Push API (web platform)
- Message payload optimization
- Delivery tracking and retry logic

### Notification Delivery
- Asynchronous notification processing
- Rate limiting per user
- Delivery confirmation tracking
- Failed delivery retry mechanism
- Expiry and cleanup of old notifications

### Data Retention
- Notification history retention period (e.g., 30 days)
- Alert trigger history retention
- Archive old notifications for analytics
- GDPR/privacy compliance for user data

### Performance Optimization
- Caching of frequently accessed alert data
- Indexed queries for alert monitoring
- Batch processing of alert checks
- Efficient notification fan-out for broadcasts

### Security & Privacy
- Secure storage of device tokens
- Encrypted notification payloads (if sensitive data)
- User consent for location tracking
- Opt-in/opt-out for all notification types
- Data deletion on user request
