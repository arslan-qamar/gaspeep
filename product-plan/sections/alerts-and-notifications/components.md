# Alerts & Notifications — Component Structure

## Components to Implement

### 1. AlertsListScreen.tsx
Display all user-configured price alerts with management options.

**Props:**
```typescript
interface AlertsListScreenProps {
  alerts: Alert[];
  userTier: 'free' | 'premium';
  onCreateAlert: () => void;
  onEditAlert: (alertId: string) => void;
  onDeleteAlert: (alertId: string) => void;
  onToggleAlert: (alertId: string, isActive: boolean) => void;
  isLoading?: boolean;
}
```

**Features:**
- Alert cards with fuel type, threshold, location
- Active/paused status toggle
- Last triggered timestamp
- Edit/Delete action buttons
- Empty state with CTA
- Filter options (active/paused/all)
- Premium gating (for free users)

### 2. CreateAlertScreen.tsx
Multi-step alert creation wizard.

**Props:**
```typescript
interface CreateAlertScreenProps {
  onSubmit: (payload: AlertPayload) => void;
  onCancel: () => void;
  editingAlert?: Alert;
  isSubmitting?: boolean;
}
```

**Features:**
- Step indicator (Step 1/3)
- Fuel type selection (Step 1)
- Location & radius picker (Step 2)
- Price threshold input (Step 3)
- "Next" and "Back" navigation
- Map preview of coverage radius
- Submit button

### 3. NotificationCenterScreen.tsx
Unified view of all notifications (alerts, broadcasts, system).

**Props:**
```typescript
interface NotificationCenterScreenProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  onAction: (notification: Notification) => void;
  isLoading?: boolean;
}
```

**Features:**
- Notification list (newest first)
- Filter by type (price alert, broadcast, system)
- Mark as read/unread
- Delete notifications
- Archive functionality
- Empty state
- Pull-to-refresh

### 4. AlertDetailModal.tsx
View and edit individual alert details.

**Props:**
```typescript
interface AlertDetailModalProps {
  alert: Alert;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
}
```

**Features:**
- Alert details display
- Edit button
- Delete confirmation
- Active/paused toggle
- Trigger history (optional)
- Coverage map preview

---

## Data Flow

```
AlertsContainer
├── AlertsListScreen
│   ├── AlertCard (repeated)
│   └── CreateAlert Button
│
├── CreateAlertScreen (modal/page)
│   ├── Step 1: Fuel Type Selection
│   ├── Step 2: Location Picker
│   └── Step 3: Threshold Input
│
└── NotificationCenterScreen
    ├── NotificationItem (repeated)
    ├── Filter options
    └── Archive functionality
```

---

## Integration Checklist

- [ ] Alerts load and display correctly
- [ ] Can create new alert (all 3 steps)
- [ ] Can edit existing alert
- [ ] Can delete alert with confirmation
- [ ] Can toggle alert active/paused
- [ ] Notifications display with correct type icons
- [ ] Notifications mark as read correctly
- [ ] Can filter notifications by type
- [ ] Map shows alert coverage radius accurately
- [ ] Location picker integrates with map
- [ ] Premium users see alert features
- [ ] Free users see upgrade prompt
- [ ] Loading states shown
- [ ] Error handling for failed submissions
- [ ] Responsive on mobile < 768px
- [ ] Responsive on tablet/desktop ≥ 768px
- [ ] Dark mode fully functional

---

## Styling (Tailwind CSS v4)

```css
/* Alerts list container */
.alerts-list {
  @apply space-y-3 p-4 md:p-6;
}

/* Alert card */
.alert-card {
  @apply p-4 border border-slate-200 dark:border-slate-700 rounded-lg;
  @apply bg-white dark:bg-slate-800 hover:shadow-md transition-shadow;
}

/* Alert badge */
.alert-badge {
  @apply inline-block px-2 py-1 rounded text-sm font-medium;
}

/* Fuel type badge colors */
.fuel-badge-e10 { @apply bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100; }
.fuel-badge-diesel { @apply bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100; }

/* Notification item */
.notification-item {
  @apply p-4 border-b border-slate-200 dark:border-slate-700;
  @apply hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors;
}

.notification-item.unread {
  @apply bg-blue-50 dark:bg-blue-900/20;
  @apply before:content-[''] before:w-2 before:h-2 before:bg-blue-500 before:rounded-full before:mr-3;
}

/* Step indicator */
.step-indicator {
  @apply flex items-center justify-between mb-6;
}

.step-indicator .step {
  @apply flex-1 h-1 bg-slate-300 dark:bg-slate-600 mx-1;
}

.step-indicator .step.completed {
  @apply bg-green-500;
}

.step-indicator .step.active {
  @apply bg-blue-500;
}
```

---

## See Also
- Specification: [spec.md](spec.md)
- Types: [types.ts](types.ts)
- Sample Data: [sample-data.json](sample-data.json)
- Tests: [tests.md](tests.md)
