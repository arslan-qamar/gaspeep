# Incremental Implementation Prompt Template

Use this template for implementing Gas Peep section-by-section. Repeat this process for each section in order.

---

## Section Prompt Template

Replace `[SECTION_NAME]` and `[SECTION_ID]` with the actual section details.

### For: [SECTION_NAME] Section

You are implementing the **[SECTION_NAME]** section of Gas Peep, a fuel price monitoring application.

**Context:**
- Product Overview: See `product-overview.md`
- Data Model: See `data-model/data-model.md`
- Design System: See `design-system/`
- This Section Spec: See `sections/[SECTION_ID]/spec.md`
- Sample Data: See `sections/[SECTION_ID]/sample-data.json`
- Type Definitions: See `sections/[SECTION_ID]/types.ts`
- Test Specifications: See `sections/[SECTION_ID]/tests.md`

**Before Starting:**
1. Read the full section specification
2. Review the TypeScript types
3. Understand the data model relationships
4. Review sample data structure
5. Reference test specifications for acceptance criteria

**Testing Requirements:**
- Analyze the test specifications and list all test cases needed
- Write failing unit, integration, e2e tests only at this stage
- NO implementation files (.ts, .go) are allowed in this phase
- Write tests that assume these interfaces exist but are unimplmented.
- Wait for my approval signal "APPROVE_TESTS" before moving to implementation

**Implementation Requirements:**
- Verify a related test exist before implementation code
- Write TypeScript with strict mode enabled
- Use component-based architecture (React)
- Props-based data flow (no global imports of section data)
- Support mobile responsive design (Tailwind CSS v4)
- Support light and dark modes
- Follow the design system colors and typography
- Include comprehensive error handling and loading states
- Add comprehensive comments explaining complex logic

**Code Review Requirements:**
- refactor and clean up code using best practices for the tech stack while keeping tests green

**Key Screens to Implement:**
[See section spec for screen list and requirements]

**Success Criteria:**
- [ ] All screens in spec are implemented
- [ ] Components accept data via props
- [ ] All test scenarios pass (see tests.md)
- [ ] Responsive design working on mobile/tablet/desktop
- [ ] Dark mode fully functional
- [ ] Error states handled gracefully
- [ ] Loading states shown appropriately
- [ ] TypeScript types defined and used throughout

**When Done:**
Run the test suite and ensure all scenarios in `tests.md` pass. Then proceed to the next section.

---

## Implementation Order

### Recommended Sequence

1. **Foundation** — Database, backend setup, auth system
2. **Shell** — Navigation and layout wrapper
3. **Map & Station Browsing** — Core map interface (attracts users first)
4. **Price Submission System** — User engagement and data collection
5. **User Authentication & Tiers** — Account management (refine as needed)
6. **Alerts & Notifications** — Premium feature, builds on map + auth
7. **Station Owner Dashboard** — Lower priority, can iterate later

---

## Instructions for Each Section

### Section 1: Foundation (Backend Setup)
- PostgreSQL database with PostGIS
- Schema creation and migrations
- Go backend with authentication
- API error handling

### Section 2: Shell (Navigation & Layout)
**Files to implement:**
- `AppShell.tsx` — Main layout component
- `Header.tsx` — Top navigation and user menu
- `BottomNav.tsx` — Mobile navigation (< 768px)
- `Navigation.tsx` — Desktop navigation (≥ 768px)
- `UserMenu.tsx` — Account dropdown

**Styling:**
- Mobile-first approach
- Responsive breakpoints: sm (640px), md (768px), lg (1024px)
- Fixed header with sticky behavior
- Bottom navigation for mobile

### Section 3: Map & Station Browsing
**API Endpoints Needed:**
- `GET /api/stations` — List stations (with geospatial filtering)
- `GET /api/stations/:id` — Station details
- `GET /api/fuel-types` — All fuel types
- `GET /api/fuel-prices?station_id=X` — Prices for station

**Components:**
- `MapView.tsx` — Interactive map with clustering
- `StationDetailSheet.tsx` — Bottom sheet with price info
- `FilterModal.tsx` — Filter by fuel type and price
- `SearchBar.tsx` — Address/station search

**Features:**
- Real-time geospatial queries
- Marker clustering at different zoom levels
- Color-coded by price (green/yellow/red)
- Search functionality
- Distance calculation from user location

### Section 4: Price Submission System
**API Endpoints Needed:**
- `POST /api/price-submissions` — Submit new price
- `GET /api/price-submissions/my-submissions` — User's submissions
- `GET /api/moderation-queue` — For moderators

**Components:**
- `PriceSubmissionForm.tsx` — Text input form
- `VoiceInputScreen.tsx` — Speech-to-text interface
- `PhotoUploadScreen.tsx` — Camera/photo OCR
- `SubmissionConfirmation.tsx` — Success feedback

**Features:**
- Three input methods (text, voice, photo)
- Real-time validation
- Station and fuel type autocomplete
- Submission history display

### Section 5: User Authentication & Tiers
**API Endpoints Needed:**
- `POST /api/auth/signup` — Register new user
- `POST /api/auth/signin` — Login
- `POST /api/auth/oauth` — OAuth callback
- `GET /api/users/profile` — Current user info
- `PUT /api/users/profile` — Update user
- `POST /api/auth/password-reset` — Password reset

**Components:**
- `SignInScreen.tsx` — Email/password + OAuth
- `SignUpScreen.tsx` — Registration with tier selection
- `ProfileScreen.tsx` — User profile management
- `TierUpgradeModal.tsx` — Premium promotion

**Features:**
- Email validation
- Password strength indicator
- OAuth integration (Google/Apple)
- Tier selection during signup
- Password reset flow

### Section 6: Alerts & Notifications
**API Endpoints Needed:**
- `POST /api/alerts` — Create alert
- `GET /api/alerts` — List user's alerts
- `PUT /api/alerts/:id` — Update alert
- `DELETE /api/alerts/:id` — Delete alert
- `GET /api/notifications` — User's notifications

**Components:**
- `AlertsListScreen.tsx` — All alerts with status
- `CreateAlertScreen.tsx` — Multi-step alert creation
- `NotificationCenterScreen.tsx` — All notifications
- `AlertDetailModal.tsx` — View/edit alert

**Features:**
- Multi-step alert creation (fuel type → location → threshold)
- Toggle alerts on/off
- Geospatial radius selection
- Notification history with filtering
- Push notification integration

### Section 7: Station Owner Dashboard
**API Endpoints Needed:**
- `POST /api/station-owners/verify` — Verify ownership
- `GET /api/station-owners/stations` — Owner's stations
- `POST /api/broadcasts` — Create broadcast
- `GET /api/broadcasts` — Owner's broadcasts
- `PUT /api/broadcasts/:id` — Update broadcast

**Components:**
- `StationOwnerDashboard.tsx` — Main dashboard
- `ClaimStationScreen.tsx` — Ownership verification
- `CreateBroadcastScreen.tsx` — Broadcast creation
- `BroadcastHistoryScreen.tsx` — Past broadcasts

**Features:**
- Station verification workflow
- Broadcast creation and scheduling
- Engagement analytics (views, clicks)
- Rate limiting for broadcasts
- Targeting by radius and fuel type

---

## Testing for Each Section

After implementing each section:

1. **Manual Testing**
   - Walk through all user flows in spec
   - Test mobile (< 768px) and desktop (≥ 768px)
   - Test light and dark modes
   - Test error states and edge cases

2. **Automated Testing**
   - Unit tests for business logic
   - Component tests for UI
   - Integration tests for API calls
   - Run test suite: `npm run test` or `go test ./...`

3. **Reference Tests.md**
   - Each section includes `tests.md` with comprehensive test scenarios
   - Ensure all scenarios pass before moving to next section

---

## Customization

Modify this template for your specific implementation:

- Replace `[SECTION_NAME]` with actual section name
- Adjust tech stack based on your choice (Node.js instead of Go, etc.)
- Add team-specific practices (code review process, PR template, etc.)
- Include deployment steps for your infrastructure
- Add performance optimization notes if needed

---

## Questions While Implementing?

Refer to:
- **Product vision**: `product-overview.md`
- **Data relationships**: `data-model/data-model.md`
- **Visual design**: `design-system/`
- **Screen requirements**: `sections/[id]/spec.md`
- **Sample data structure**: `sections/[id]/sample-data.json`
- **Acceptance criteria**: `sections/[id]/tests.md`

---

**Start with Foundation, then proceed through sections 2-7 in order.**
