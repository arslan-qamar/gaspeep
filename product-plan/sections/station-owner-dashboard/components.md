# Station Owner Dashboard — Component Structure

## Components to Implement

### 1. StationOwnerDashboard.tsx
Main dashboard showing claimed stations and broadcast management.

**Props:**
```typescript
interface StationOwnerDashboardProps {
  owner: StationOwner;
  stations: Station[];
  broadcasts: Broadcast[];
  onClaimStation: () => void;
  onCreateBroadcast: () => void;
  onEditBroadcast: (broadcastId: string) => void;
  isLoading?: boolean;
}
```

**Features:**
- Owner welcome banner
- Verification status indicator
- "My Stations" section with cards
- Recent broadcasts list
- Statistics cards (stations, active broadcasts, reach)
- "Claim New Station" button
- "Create Broadcast" button
- Empty states for no stations/broadcasts

### 2. ClaimStationScreen.tsx
Multi-step station ownership verification flow.

**Props:**
```typescript
interface ClaimStationScreenProps {
  onStationClaimed: (stationId: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}
```

**Features:**
- Step indicator (Step 1/3)
- Step 1: Find Station (search + map)
- Step 2: Verify Ownership (document upload)
- Step 3: Confirm & Review
- Search results with claim status
- Map integration for location verification
- Document upload area
- Error handling for already-claimed stations

### 3. CreateBroadcastScreen.tsx
Broadcast creation and scheduling interface.

**Props:**
```typescript
interface CreateBroadcastScreenProps {
  stations: Station[];
  selectedStationId?: string;
  onSubmit: (payload: BroadcastPayload) => void;
  onCancel: () => void;
  editingBroadcast?: Broadcast;
  isSubmitting?: boolean;
}
```

**Features:**
- Station selector dropdown
- Broadcast title and message fields
- Date/time pickers (start/end)
- Radius slider for targeting
- Fuel type filter (optional)
- Preview of message
- Character count for message
- Submit/Schedule buttons
- Rate limiting indicator

### 4. BroadcastHistoryScreen.tsx
View past and scheduled broadcasts with engagement metrics.

**Props:**
```typescript
interface BroadcastHistoryScreenProps {
  broadcasts: Broadcast[];
  onEdit: (broadcastId: string) => void;
  onDuplicate: (broadcastId: string) => void;
  onDelete: (broadcastId: string) => void;
}
```

**Features:**
- List of broadcasts (newest first)
- Status badge (Active, Scheduled, Expired)
- Engagement metrics (views, clicks)
- Edit/Duplicate/Delete actions
- Filter by status
- Sort options
- Empty state

### 5. StationCard.tsx
Individual station display on dashboard.

**Props:**
```typescript
interface StationCardProps {
  station: Station;
  verificationStatus: 'verified' | 'pending' | 'not_verified';
  lastBroadcastDate?: Date;
  onBroadcast: () => void;
  onEdit: () => void;
  onViewAnalytics: () => void;
}
```

**Features:**
- Station name and address
- Brand logo/icon
- Verification status badge
- Last broadcast timestamp
- Quick action buttons
- Engagement count (optional)

---

## Data Flow

```
StationOwnerContainer
├── Dashboard
│   ├── Owner Banner
│   ├── Stations Section
│   │   ├── StationCard (repeated)
│   │   └── Claim New Station Button
│   └── Broadcasts Section
│       ├── BroadcastItem (repeated)
│       └── Create Broadcast Button
│
├── ClaimStationScreen (modal/page)
│   ├── Step 1: Find Station
│   ├── Step 2: Verify
│   └── Step 3: Confirm
│
├── CreateBroadcastScreen (modal/page)
│   ├── Station Selection
│   ├── Broadcast Content
│   ├── Targeting Options
│   └── Schedule
│
└── BroadcastHistoryScreen (page)
    ├── Broadcast List
    └── Filter/Sort Options
```

---

## Integration Checklist

- [ ] Dashboard loads owner profile correctly
- [ ] Stations display with proper status
- [ ] Can claim new station (3-step process)
- [ ] Verification workflow functions
- [ ] Can create broadcast for station
- [ ] Schedule date/time pickers work
- [ ] Radius slider sets coverage area correctly
- [ ] Broadcast list shows all broadcasts
- [ ] Engagement metrics display
- [ ] Can edit existing broadcast
- [ ] Can delete broadcast with confirmation
- [ ] Can duplicate broadcast
- [ ] Rate limiting shown to user
- [ ] Empty states display appropriately
- [ ] Loading states shown
- [ ] Error messages are helpful
- [ ] Responsive on mobile < 768px
- [ ] Responsive on tablet/desktop ≥ 768px
- [ ] Dark mode fully functional

---

## Styling (Tailwind CSS v4)

```css
/* Dashboard container */
.dashboard-container {
  @apply max-w-6xl mx-auto p-4 md:p-6;
}

/* Verification banner */
.verification-banner {
  @apply p-4 mb-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700;
}

/* Station card */
.station-card {
  @apply p-4 border border-slate-200 dark:border-slate-700 rounded-lg;
  @apply bg-white dark:bg-slate-800 hover:shadow-md transition-shadow;
}

/* Broadcast item */
.broadcast-item {
  @apply p-4 border-l-4 border-blue-500 rounded-lg bg-slate-50 dark:bg-slate-700/50;
  @apply mb-3;
}

.broadcast-item.active {
  @apply border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20;
}

.broadcast-item.scheduled {
  @apply border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20;
}

.broadcast-item.expired {
  @apply border-l-4 border-slate-400 bg-slate-100 dark:bg-slate-600/50 opacity-75;
}

/* Statistics cards */
.stat-card {
  @apply p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700;
}

.stat-value {
  @apply text-3xl font-bold text-slate-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-slate-600 dark:text-slate-400 mt-1;
}

/* Message preview */
.message-preview {
  @apply p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700;
  @apply text-slate-900 dark:text-white;
}
```

---

## See Also
- Specification: [spec.md](spec.md)
- Types: [types.ts](types.ts)
- Sample Data: [sample-data.json](sample-data.json)
- Tests: [tests.md](tests.md)
