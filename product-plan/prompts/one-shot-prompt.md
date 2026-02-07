# One-Shot Implementation Prompt for Gas Peep

Use this prompt with your coding agent (Claude, ChatGPT, etc.) for a complete, end-to-end implementation of Gas Peep in one session.

---

## System Instructions

You are an expert full-stack engineer implementing a production-ready fuel price monitoring application called **Gas Peep**. Before writing code, ask clarifying questions about:

1. **Tech Stack** — Confirm choice of React/React Native, backend language (Go vs Node.js), database setup
2. **Authentication** — Prefer OAuth (Google/Apple) or email/password?
3. **Payment Processing** — Real Stripe integration or mock payments for testing?
4. **Map Provider** — Mapbox GL JS, Google Maps API, or OpenStreetMap?
5. **Push Notifications** — Firebase Cloud Messaging (FCM) or in-app only for MVP?
6. **Deployment** — Local Docker setup, cloud platforms (AWS/GCP/Azure), or development build only?
7. **Database** — PostgreSQL with PostGIS, or cloud alternatives (MongoDB geospatial)?

Once you confirm the above, proceed with complete, production-ready implementation of all 5 sections plus the application shell.

---

## Product Overview

**Gas Peep** is a community-driven fuel price monitoring app with 11 fuel types across multiple stations. Users can browse prices on an interactive map, submit prices via text/voice/photo, set custom alerts (Premium), and station owners can broadcast promotions.

**Core Features:**
- Interactive map with station browsing
- Community price submissions (text, voice, OCR photo)
- User authentication with Free/Premium tiers
- Custom price alerts with push notifications (Premium)
- Station owner dashboard with broadcast system

**User Tiers:**
- **Free**: Ad-supported map browsing, price submissions
- **Premium**: Ad-free map, custom alerts, broadcast notifications ($4.99/month)

**Fuel Types**: E10, Unleaded 91, Diesel, Premium Diesel, U95, U98, LPG, Truck Diesel, AdBlue, E85, Biodiesel

---

## Architecture Requirements

### Frontend
- **Framework**: React with TypeScript (or React Native for cross-platform)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 (no custom tailwind.config.js)
- **State Management**: TanStack Query (React Query) for API state + Zustand or Context for UI state
- **Forms**: React Hook Form + Zod for validation
- **Map Library**: Mapbox GL JS or Google Maps JavaScript API
- **Testing**: Vitest + React Testing Library

### Backend (Go)
- **Framework**: Gin or Echo
- **Database**: PostgreSQL with PostGIS extension (mandatory for geospatial queries)
- **Authentication**: JWT + OAuth2 support
- **API**: REST endpoints (GraphQL optional)
- **Async Jobs**: Background workers for moderation, notifications
- **Testing**: Go's built-in testing + Table-Driven Tests

### Infrastructure
- **Containerization**: Docker + docker compose for local development
- **Environment**: .env-based configuration
- **Logging**: Structured JSON logging
- **Secrets**: Environment variables (no hardcoded credentials)

---

## Data Model (TypeScript Interfaces)

```typescript
// Core entities with relationships

interface User {
  id: string;
  email: string;
  displayName: string;
  tier: 'free' | 'premium';
  registrationDate: Date;
  locationPreferences: {
    latitude: number;
    longitude: number;
  };
  notificationPreferences: {
    priceAlerts: boolean;
    broadcasts: boolean;
  };
}

interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  operatingHours: string;
  amenities: string[];
  lastVerifiedDate: Date;
}

interface FuelType {
  id: string;
  name: string;
  displayName: string;
  description: string;
  colorCode: string;
  displayOrder: number;
}

interface FuelPrice {
  id: string;
  stationId: string;
  fuelTypeId: string;
  price: number;
  currency: string;
  unit: string;
  lastUpdatedAt: Date;
  verificationStatus: 'unverified' | 'verified' | 'rejected';
  confirmationCount: number;
}

interface PriceSubmission {
  id: string;
  userId: string;
  stationId: string;
  fuelTypeId: string;
  price: number;
  submissionMethod: 'text' | 'voice' | 'photo';
  submittedAt: Date;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  verificationConfidence: number;
  photoUrl?: string;
  voiceRecordingUrl?: string;
  ocrData?: string;
  moderatorNotes?: string;
}

interface Alert {
  id: string;
  userId: string;
  fuelTypeId: string;
  priceThreshold: number;
  location: {
    latitude: number;
    longitude: number;
  };
  radiusKm: number;
  alertName: string;
  isActive: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

interface Notification {
  id: string;
  userId: string;
  type: 'price_alert' | 'broadcast' | 'system';
  title: string;
  message: string;
  sentAt: Date;
  isRead: boolean;
  deliveryStatus: 'pending' | 'sent' | 'failed';
  actionUrl?: string;
}

interface StationOwner {
  id: string;
  userId: string;
  businessName: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments: string[];
  contactInfo: string;
  verifiedAt?: Date;
}

interface Broadcast {
  id: string;
  stationOwnerId: string;
  stationId: string;
  title: string;
  message: string;
  targetRadiusKm: number;
  startDate: Date;
  endDate: Date;
  broadcastStatus: 'scheduled' | 'active' | 'expired';
  targetFuelTypes?: string[];
  createdAt: Date;
  engagementMetrics: {
    views: number;
    clicks: number;
  };
}
```

---

## Implementation Checklist

### Phase 1: Foundation & Database ✅ COMPLETE
- [x] PostgreSQL database with PostGIS extension
- [x] Schema for all 9 entities with indexes and constraints (users, stations, fuel_types, fuel_prices, price_submissions, alerts, notifications, station_owners, broadcasts)
- [x] Go backend with Gin framework
- [x] API error handling middleware
- [x] Health check endpoint
- [x] Docker setup (docker compose.yml)
- [x] Automatic database migrations on startup
- [x] Connection pool optimization

### Phase 2: Authentication & User Management ✅ COMPLETE
- [x] User registration (email/password)
- [x] Login and JWT token generation
- [ ] OAuth provider integration (Google/Apple) - Not implemented yet
- [x] User profile retrieval (GET /api/auth/me)
- [x] Tier management (Free/Premium) - Database schema ready
- [x] Middleware for protected routes (JWT validation)
- [x] Frontend route protection component
- [x] Password hashing with bcrypt
- [x] Sign In page with React Hook Form + Zod validation
- [x] Sign Up page with React Hook Form + Zod validation

### Phase 3: Core Map Interface ✅ COMPLETE
- [x] Station CRUD operations
- [x] Fuel type list endpoint (schema ready with 11 fuel types)
- [x] Fuel price endpoints with geospatial queries
- [x] Map integration (Leaflet/OpenStreetMap)
- [x] Station marker rendering
- [x] Filter by fuel type and price range
- [x] Station detail sheet component

### Phase 4: Price Submission System ⏳ PENDING
- [ ] Price submission endpoint
- [ ] Moderation queue implementation
- [ ] Text submission form
- [ ] Voice input (speech-to-text)
- [ ] Photo upload with OCR (placeholder)
- [ ] Submission history view
- [ ] Confidence scoring for submissions

### Phase 5: Alerts & Notifications ⏳ PENDING
- [ ] Alert CRUD endpoints
- [ ] Price monitoring service (background job)
- [ ] Notification generation
- [ ] Push notification delivery (FCM or in-app)
- [ ] Alert management UI (create, edit, delete, toggle)
- [ ] Notification center/history view

### Phase 6: Station Owner Dashboard ⏳ PENDING
- [ ] Station ownership claim flow
- [ ] Verification workflow
- [ ] Broadcast creation and scheduling
- [ ] Broadcast delivery to Premium users
- [ ] Analytics dashboard (reach, engagement)
- [ ] Anti-spam rate limiting

### Phase 7: Premium Features & Monetization ⏳ PENDING
- [ ] Tier-based feature gating
- [ ] Payment integration (Stripe test mode)
- [ ] Subscription management
- [ ] Ad framework (for Free users)
- [ ] Feature parity validation

---

### Current Status (Updated: February 7, 2026)
- **Phase 1**: ✅ Complete - All database tables, migrations, and infrastructure ready
- **Phase 2**: ✅ Complete - Full authentication with JWT, sign-in/sign-up pages with validation
- **Phase 3**: ✅ Complete - Map interface, station browsing, fuel price display working
- **Phases 4-7**: ⏳ Pending - Database schemas ready, awaiting implementation

**Working API Endpoints:**
- GET `/health` - Health check
- POST `/api/auth/signup` - User registration  
- POST `/api/auth/signin` - User login
- GET `/api/auth/me` - Get current user (requires JWT token)

**Next Steps:** Implement Phase 3 (Map & Station Browsing)

---

## Folder Structure (Recommended)

```
gas-peep/
├── backend/                          # Go backend
│   ├── cmd/
│   │   └── api/
│   │       └── main.go
│   ├── internal/
│   │   ├── models/                   # Entity definitions
│   │   ├── handlers/                 # API handlers
│   │   ├── repository/               # Database layer
│   │   ├── services/                 # Business logic
│   │   ├── middleware/               # Auth, logging, etc.
│   │   └── utils/
│   ├── migrations/                   # Database schema
│   ├── go.mod
│   ├── Dockerfile
│   └── docker compose.yml
│
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   ├── components/               # Reusable UI components
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── services/                 # API client
│   │   ├── store/                    # Zustand store
│   │   ├── types/                    # TypeScript interfaces
│   │   ├── utils/                    # Utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/                        # Test files
│   ├── vite.config.ts
│   ├── tailwind.config.ts            # NOT NEEDED for Tailwind v4
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
└── docs/                             # Documentation
    ├── API.md
    ├── SETUP.md
    ├── ARCHITECTURE.md
    └── TESTING.md
```

---

## Key Implementation Details

### Map Integration
- Use Mapbox GL JS or Google Maps API
- Implement clustering at zoom levels < 12
- Show individual markers at zoom > 12
- Color-code markers: green (low price), yellow (medium), red (high)
- Support search by address/city/station name
- Center map on user's current location (with permission)

### Price Submission
- Three methods: text (manual), voice (speech-to-text), photo (OCR placeholder)
- Real-time validation of price ranges
- Automatic confidence scoring based on historical data
- Moderation queue for suspicious submissions
- Community contribution tracking

### Authentication Flow
- OAuth for frictionless signup (Google/Apple)
- Email/password as fallback
- JWT tokens with 24-hour expiration
- Refresh tokens for persistent sessions
- Social account linking

### Alerts System
- Set price thresholds per fuel type
- Geospatial radius-based targeting (PostGIS)
- Background job monitors prices every 5 minutes
- Trigger notifications when threshold met
- Prevent notification spam (cooldown period)

### Station Owner Broadcast
- Ownership verification via email or document upload
- Rate limiting (max 5 broadcasts per station per day)
- Targeting by radius and optional fuel types
- Scheduled broadcasts with start/end dates
- Engagement tracking (views, clicks)

---

## Testing Strategy

### Unit Tests (Backend)
- Business logic (price validation, scoring)
- Authentication and JWT
- Geospatial queries
- Error handling

### Integration Tests (Backend)
- Full API request/response cycles
- Database transactions
- Moderation workflows
- Notification generation

### Component Tests (Frontend)
- Individual UI components
- Form validation and submission
- State management

### E2E Tests (Full Stack)
- User signup and authentication
- Map browsing and station selection
- Price submission flow
- Alert creation and notification
- Station owner broadcast

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] CORS headers configured correctly
- [ ] API rate limiting implemented
- [ ] Error logging and monitoring
- [ ] Security headers (HSTS, CSP, etc.)
- [ ] Database backups configured
- [ ] Performance optimization (caching, indexing)
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Documentation updated

---

## Success Criteria

✅ All 5 sections implemented with core features  
✅ Authentication and tier system working  
✅ Map interface renders correctly with real data  
✅ Price submissions flow through moderation  
✅ Alerts trigger and send notifications  
✅ Station owner broadcasts deliver to Premium users  
✅ Database queries optimized for performance  
✅ All tests passing (unit + integration)  
✅ Error handling and user feedback complete  
✅ Documentation updated  

---

## Next Steps After Implementation

1. **Load Testing** — Ensure 1000+ concurrent users supported
2. **Security Audit** — Review authentication, data validation, SQL injection
3. **Performance Optimization** — Monitor API response times, database queries
4. **User Feedback** — Beta test with real users, iterate on UX
5. **Monitoring** — Set up alerting for errors, performance issues
6. **Scaling** — Plan infrastructure for regional expansion

---

**Ready to begin?** Confirm tech stack preferences above, then start with Phase 1 (Foundation & Database).
