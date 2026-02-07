# Alerts & Notifications — Test Specifications

## Alert Creation Flow

### Flow 1: Create First Alert
**Given:** Premium user with no alerts  
**When:** User clicks "Create Alert"  
**Then:**
- [ ] CreateAlertScreen opens
- [ ] Step 1 (Fuel Type) shown first
- [ ] Fuel types E10, Diesel, U95, U98, LPG, etc. available
- [ ] Single selection enforced
- [ ] "Next" button progresses to Step 2
- [ ] Location picker shows current location
- [ ] Radius slider (1-50 km) appears
- [ ] Step 3 shows price threshold input
- [ ] Submit creates alert successfully

### Flow 2: Alerts List View
**Given:** Premium user with 3 alerts  
**When:** User navigates to alerts page  
**Then:**
- [ ] All 3 alerts display as cards
- [ ] Each shows fuel type badge
- [ ] Threshold price visible
- [ ] Location/radius shown
- [ ] Active/paused toggle visible
- [ ] Last triggered date shown

### Flow 3: Toggle Alert On/Off
**Given:** User viewing active alert  
**When:** User clicks toggle  
**Then:**
- [ ] Alert status changes
- [ ] Toggle animates
- [ ] Backend updates
- [ ] Notification will not trigger if paused

### Flow 4: Edit Alert
**Given:** User viewing existing alert  
**When:** User clicks "Edit"  
**Then:**
- [ ] CreateAlertScreen opens with alert data
- [ ] Pre-fills all previous values
- [ ] "Update" button instead of "Create"
- [ ] Changes save successfully

### Flow 5: Delete Alert
**Given:** User viewing alert  
**When:** User clicks "Delete"  
**Then:**
- [ ] Confirmation dialog shows
- [ ] "Are you sure?" message
- [ ] Cancel and Confirm buttons
- [ ] Confirming deletes alert
- [ ] Removed from list

## Notification Tests

### Flow 1: Price Alert Triggered
**Given:** Alert set for Diesel ≤ $1.50  
**When:** Price drops to $1.49  
**Then:**
- [ ] Notification generated
- [ ] Sent to user (push if configured)
- [ ] Shows in notification center
- [ ] Contains station name, fuel type, new price
- [ ] "View on Map" button available

### Flow 2: View Notification
**Given:** Unread notification in center  
**When:** User opens notification  
**Then:**
- [ ] Notification marked as read
- [ ] Can view details
- [ ] Can dismiss
- [ ] Can take action (view on map)

### Flow 3: Multiple Notifications
**Given:** Multiple alerts triggered  
**When:** User views notification center  
**Then:**
- [ ] All notifications appear
- [ ] Most recent first
- [ ] Can scroll through all
- [ ] Can filter by type

### Flow 4: Notification Cooldown
**Given:** Alert triggered, notification sent  
**When:** Price drops again within cooldown (e.g., 1 hour)  
**Then:**
- [ ] No duplicate notification sent
- [ ] User not spammed
- [ ] Alert silently updates

### Flow 5: Mark as Read
**Given:** Unread notifications  
**When:** User clicks to read  
**Then:**
- [ ] Notification marked read
- [ ] Unread badge cleared
- [ ] Visual indicator updated

## Premium vs Free Tests

### Premium 1: Can Create Alerts
**Given:** Premium user  
**When:** User navigates to Alerts  
**Then:**
- [ ] Full alert functionality available
- [ ] Create button enabled
- [ ] Can set multiple alerts

### Free 1: Alerts Locked
**Given:** Free user on Alerts page  
**When:** User tries to create alert  
**Then:**
- [ ] Feature locked
- [ ] "Upgrade to Premium" message
- [ ] Shows alert benefits
- [ ] CTA button to upgrade

## Broadcast Notification Tests

### Broadcast 1: Receive Broadcast
**Given:** Premium user near station  
**When:** Station owner broadcasts offer  
**Then:**
- [ ] Notification appears
- [ ] Shows station name and offer
- [ ] Can tap to view details
- [ ] Mark as read works

### Broadcast 2: Broadcast Details
**Given:** User opens broadcast notification  
**When:** Notification tapped  
**Then:**
- [ ] Full offer text displayed
- [ ] Station details shown
- [ ] Can view on map
- [ ] Can dismiss

## Error State Tests

### Error 1: Geolocation Fails
**Given:** User creating alert  
**When:** "Use Current Location" fails  
**Then:**
- [ ] Error message: "Unable to get current location"
- [ ] Can enter location manually
- [ ] Can choose from map

### Error 2: Invalid Threshold
**Given:** User entering price threshold  
**When:** Enters $0 or negative  
**Then:**
- [ ] Validation error shown
- [ ] Cannot submit

### Error 3: Duplicate Alert
**Given:** User creating alert for same criteria  
**When:** Identical alert already exists  
**Then:**
- [ ] Warning: "You already have this alert"
- [ ] Can proceed anyway
- [ ] Or cancel

## Responsive Design Tests

- [ ] Alert cards responsive (mobile/tablet/desktop)
- [ ] Step indicators visible on all sizes
- [ ] Map picker usable on mobile
- [ ] Buttons touch-friendly
- [ ] Notifications list scrollable

## Dark Mode Tests

- [ ] Alert cards dark background
- [ ] Step indicators visible
- [ ] Notification center dark background
- [ ] All text readable

## Success Criteria

✅ Create alert with all parameters  
✅ Alerts list displays correctly  
✅ Can edit and delete alerts  
✅ Notifications trigger on price drops  
✅ Notification center functional  
✅ Premium gating enforced  
✅ Responsive and dark mode working  
