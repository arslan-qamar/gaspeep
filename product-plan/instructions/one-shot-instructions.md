# Gas Peep — Complete Implementation Instructions

This document provides comprehensive, step-by-step implementation instructions for the complete Gas Peep application. Use this alongside `prompts/one-shot-prompt.md` when building the full product.

---

## Table of Contents

1. [Phase 1: Foundation & Database Setup](#phase-1-foundation--database-setup)
2. [Phase 2: Application Shell & Navigation](#phase-2-application-shell--navigation)
3. [Phase 3: Map & Station Browsing](#phase-3-map--station-browsing)
4. [Phase 4: Price Submission System](#phase-4-price-submission-system)
5. [Phase 5: User Authentication & Tiers](#phase-5-user-authentication--tiers)
6. [Phase 6: Alerts & Notifications](#phase-6-alerts--notifications)
7. [Phase 7: Station Owner Dashboard](#phase-7-station-owner-dashboard)
8. [Phase 8: Monetization & Premium Features](#phase-8-monetization--premium-features)
9. [Testing & Deployment](#testing--deployment)

---

## Phase 1: Foundation & Database Setup

**Duration:** 2-3 days  
**Goal:** Database schema, Go backend scaffold, API error handling

### 1.1 Database Schema (PostgreSQL + PostGIS)

Create database and enable PostGIS extension:

```sql
CREATE DATABASE gas_peep;

-- Connect to gas_peep and enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
```

Create tables (in migration file):

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stations table
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  address VARCHAR(500),
  coordinates GEOGRAPHY(POINT, 4326),
  operating_hours VARCHAR(255),
  amenities TEXT[],
  last_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coordinates USING GIST (coordinates)
);

-- Fuel types (static data)
CREATE TABLE fuel_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  description VARCHAR(500),
  color_code VARCHAR(50),
  display_order INT
);

-- Fuel prices (materialized view of latest)
CREATE TABLE fuel_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID NOT NULL REFERENCES stations(id),
  fuel_type_id VARCHAR(50) NOT NULL REFERENCES fuel_types(id),
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  unit VARCHAR(50) DEFAULT 'liter',
  last_updated_at TIMESTAMP,
  verification_status VARCHAR(50) DEFAULT 'unverified',
  confirmation_count INT DEFAULT 0,
  UNIQUE(station_id, fuel_type_id)
);

-- Price submissions
CREATE TABLE price_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  station_id UUID NOT NULL REFERENCES stations(id),
  fuel_type_id VARCHAR(50) NOT NULL REFERENCES fuel_types(id),
  price DECIMAL(10, 2),
  submission_method VARCHAR(50),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moderation_status VARCHAR(50) DEFAULT 'pending',
  verification_confidence DECIMAL(3, 2),
  photo_url VARCHAR(500),
  voice_recording_url VARCHAR(500),
  ocr_data TEXT,
  moderator_notes TEXT
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  fuel_type_id VARCHAR(50) NOT NULL REFERENCES fuel_types(id),
  price_threshold DECIMAL(10, 2),
  location GEOGRAPHY(POINT, 4326),
  radius_km INT,
  alert_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_triggered_at TIMESTAMP,
  trigger_count INT DEFAULT 0
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  notification_type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  delivery_status VARCHAR(50) DEFAULT 'pending',
  action_url VARCHAR(500),
  alert_id UUID REFERENCES alerts(id),
  broadcast_id UUID REFERENCES broadcasts(id)
);

-- Station owners
CREATE TABLE station_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  business_name VARCHAR(255),
  verification_status VARCHAR(50) DEFAULT 'pending',
  verification_documents TEXT[],
  contact_info VARCHAR(255),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Broadcasts
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_owner_id UUID NOT NULL REFERENCES station_owners(id),
  station_id UUID NOT NULL REFERENCES stations(id),
  title VARCHAR(255),
  message TEXT,
  target_radius_km INT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  broadcast_status VARCHAR(50) DEFAULT 'scheduled',
  target_fuel_types VARCHAR(50)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0
);
```

### 1.2 Go Backend Scaffold

Create project structure:

```bash
mkdir -p gas-peep-backend
cd gas-peep-backend
go mod init github.com/yourname/gas-peep-backend
```

**Main dependencies to add to go.mod:**
```
github.com/gin-gonic/gin v1.9.1
github.com/lib/pq v1.10.9
github.com/golang-jwt/jwt/v5 v5.0.0
github.com/golang-migrate/migrate/v4 v4.16.2
golang.org/x/crypto v0.14.0
github.com/joho/godotenv v1.5.1
```

Create `cmd/api/main.go`:

```go
package main

import (
  "log"
  "os"
  "github.com/gin-gonic/gin"
  "github.com/joho/godotenv"
)

func main() {
  // Load .env file
  godotenv.Load()

  // Create Gin router
  router := gin.Default()

  // Middleware
  router.Use(CORSMiddleware())
  router.Use(ErrorHandlingMiddleware())

  // Health check
  router.GET("/health", func(c *gin.Context) {
    c.JSON(200, gin.H{"status": "ok"})
  })

  // API routes (will add more)
  
  port := os.Getenv("PORT")
  if port == "" {
    port = "8080"
  }
  
  router.Run(":" + port)
}

func CORSMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
    c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
    c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    
    if c.Request.Method == "OPTIONS" {
      c.AbortWithStatus(204)
      return
    }
    c.Next()
  }
}

func ErrorHandlingMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    c.Next()
    if len(c.Errors) > 0 {
      err := c.Errors.Last()
      c.JSON(500, gin.H{
        "error": err.Error(),
        "status": "error",
      })
    }
  }
}
```

### 1.3 Database Connection

Create `internal/db/db.go`:

```go
package db

import (
  "database/sql"
  "fmt"
  "os"
  
  _ "github.com/lib/pq"
)

func NewDB() (*sql.DB, error) {
  dsn := fmt.Sprintf(
    "host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
    os.Getenv("DB_HOST"),
    os.Getenv("DB_PORT"),
    os.Getenv("DB_USER"),
    os.Getenv("DB_PASSWORD"),
    os.Getenv("DB_NAME"),
  )
  
  db, err := sql.Open("postgres", dsn)
  if err != nil {
    return nil, err
  }
  
  if err = db.Ping(); err != nil {
    return nil, err
  }
  
  return db, nil
}
```

### 1.4 Create .env File

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gas_peep

# Server
PORT=8080
ENV=development

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# OAuth (fill in later)
GOOGLE_OAUTH_ID=
GOOGLE_OAUTH_SECRET=
APPLE_OAUTH_ID=
APPLE_OAUTH_SECRET=

# File uploads
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_ACCESS_KEY=
AWS_SECRET_KEY=

# Push notifications
FCM_SERVER_KEY=
```

### 1.5 Seed Initial Data

Create migrations for fuel types:

```go
// internal/migrations/seed_fuel_types.go
func SeedFuelTypes(db *sql.DB) error {
  fuelTypes := []struct {
    id       string
    name     string
    colorCode string
  }{
    {"e10", "E10", "green-500"},
    {"unleaded-91", "Unleaded 91", "yellow-500"},
    {"diesel", "Diesel", "orange-500"},
    {"premium-diesel", "Premium Diesel", "red-500"},
    {"u95", "U95", "blue-500"},
    {"u98", "U98", "purple-500"},
    {"lpg", "LPG", "pink-500"},
    {"truck-diesel", "Truck Diesel", "orange-600"},
    {"adblue", "AdBlue", "cyan-500"},
    {"e85", "E85", "lime-500"},
    {"biodiesel", "Biodiesel", "green-600"},
  }
  
  for _, ft := range fuelTypes {
    _, err := db.Exec(`
      INSERT INTO fuel_types (id, name, display_name, description, color_code, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, ft.id, ft.name, ft.name, "", ft.colorCode, 0)
    if err != nil {
      return err
    }
  }
  return nil
}
```

### 1.6 Repository Layer Setup

Create `internal/repository/user_repository.go`:

```go
package repository

import (
  "database/sql"
  "github.com/google/uuid"
)

type User struct {
  ID          string
  Email       string
  DisplayName string
  Tier        string
  CreatedAt   string
}

type UserRepository struct {
  db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
  return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(email, passwordHash, displayName, tier string) (*User, error) {
  id := uuid.New().String()
  
  _, err := r.db.Exec(`
    INSERT INTO users (id, email, password_hash, display_name, tier)
    VALUES ($1, $2, $3, $4, $5)
  `, id, email, passwordHash, displayName, tier)
  
  if err != nil {
    return nil, err
  }
  
  return &User{
    ID:          id,
    Email:       email,
    DisplayName: displayName,
    Tier:        tier,
  }, nil
}

func (r *UserRepository) GetUserByEmail(email string) (*User, error) {
  user := &User{}
  err := r.db.QueryRow(`
    SELECT id, email, display_name, tier, created_at FROM users WHERE email = $1
  `, email).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Tier, &user.CreatedAt)
  
  if err != nil {
    return nil, err
  }
  
  return user, nil
}

func (r *UserRepository) GetUserByID(id string) (*User, error) {
  user := &User{}
  err := r.db.QueryRow(`
    SELECT id, email, display_name, tier FROM users WHERE id = $1
  `, id).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Tier)
  
  if err != nil {
    return nil, err
  }
  
  return user, nil
}
```

### Checklist for Phase 1
- [ ] PostgreSQL database created with PostGIS
- [ ] All 8 tables created with proper indexes
- [ ] Fuel types seeded
- [ ] Go project initialized with dependencies
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Health check endpoint responds
- [ ] Basic error handling middleware in place

---

## Phase 2: Application Shell & Navigation

**Duration:** 1-2 days  
**Goal:** Navigation structure, header, bottom nav (mobile), user menu

### 2.1 Shell Layout Component

Create `src/shell/AppShell.tsx`:

```typescript
import React from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      <Header 
        userTier={user?.tier}
        isAuthenticated={!!user}
        currentPath={location.pathname}
      />
      
      <main className="flex-1 mt-16 mb-16 md:mb-0 overflow-y-auto">
        {children}
      </main>
      
      {/* Bottom nav only visible on mobile */}
      <BottomNav 
        currentPath={location.pathname}
        isAuthenticated={!!user}
        userTier={user?.tier}
      />
    </div>
  );
};
```

### 2.2 Header Component

Create `src/shell/components/Header.tsx`:

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { DesktopNav } from './DesktopNav';

interface HeaderProps {
  userTier?: 'free' | 'premium';
  isAuthenticated?: boolean;
  currentPath?: string;
}

export const Header: React.FC<HeaderProps> = ({
  userTier,
  isAuthenticated,
  currentPath,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-30">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            Gas Peep
          </span>
        </button>

        {/* Desktop Navigation */}
        <DesktopNav 
          currentPath={currentPath}
          isAuthenticated={isAuthenticated}
          userTier={userTier}
        />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              U
            </div>
          </button>
          
          {userMenuOpen && (
            <UserMenu 
              isOpen={userMenuOpen}
              onClose={() => setUserMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
};
```

### 2.3 Bottom Navigation (Mobile)

Create `src/shell/components/BottomNav.tsx`:

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Bell, Menu } from 'lucide-react';

interface BottomNavProps {
  currentPath?: string;
  isAuthenticated: boolean;
  userTier?: 'free' | 'premium';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPath,
  isAuthenticated,
  userTier,
}) => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Map', icon: MapPin, path: '/', always: true },
    { label: 'Submit', icon: Plus, path: '/submit', requireAuth: true },
    { label: 'Alerts', icon: Bell, path: '/alerts', requireAuth: true, premium: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-30 flex items-center justify-around">
      {navItems.map((item) => {
        const isVisible = item.always || (isAuthenticated && (!item.premium || userTier === 'premium'));
        
        if (!isVisible) return null;

        const isActive = currentPath === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center h-full flex-1 text-xs transition-colors ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
          >
            <Icon size={24} />
            <span className="mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
```

### 2.4 User Menu Dropdown

Create `src/shell/components/UserMenu.tsx`:

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, Settings, LogOut, Zap } from 'lucide-react';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg z-40">
      {user && (
        <>
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-slate-900 dark:text-white">{user.displayName}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
          </div>

          <button
            onClick={() => handleNavigation('/profile')}
            className="block w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <User className="inline mr-2" size={16} />
            Profile
          </button>

          <button
            onClick={() => handleNavigation('/settings')}
            className="block w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Settings className="inline mr-2" size={16} />
            Settings
          </button>

          {user.tier === 'free' && (
            <button
              onClick={() => handleNavigation('/upgrade')}
              className="block w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-semibold"
            >
              <Zap className="inline mr-2" size={16} />
              Upgrade to Premium
            </button>
          )}

          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-t border-slate-200 dark:border-slate-700"
          >
            <LogOut className="inline mr-2" size={16} />
            Logout
          </button>
        </>
      )}
    </div>
  );
};
```

### 2.5 Router Setup

Create `src/lib/router.tsx`:

```typescript
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../shell/AppShell';
import { MapView } from '../sections/map/MapView';
import { PriceSubmissionForm } from '../sections/price-submission/PriceSubmissionForm';
import { AlertsList } from '../sections/alerts/AlertsList';
import { SignInScreen } from '../sections/auth/SignInScreen';
import { SignUpScreen } from '../sections/auth/SignUpScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell><MapView /></AppShell>,
  },
  {
    path: '/submit',
    element: <AppShell><PriceSubmissionForm /></AppShell>,
  },
  {
    path: '/alerts',
    element: <AppShell><AlertsList /></AppShell>,
  },
  {
    path: '/signin',
    element: <SignInScreen />,
  },
  {
    path: '/signup',
    element: <SignUpScreen />,
  },
]);
```

### Checklist for Phase 2
- [ ] AppShell wrapping all pages
- [ ] Header renders correctly
- [ ] Bottom nav shows on mobile only (< 768px)
- [ ] Desktop nav shows on larger screens
- [ ] User menu opens/closes
- [ ] Navigation links work
- [ ] Responsive layout verified
- [ ] Dark mode styling applied

---

## Phases 3-7: Section Implementation

Each section follows similar patterns. Reference the section-specific instructions:

- **Phase 3**: [sections/map-and-station-browsing/spec.md](../sections/map-and-station-browsing/spec.md) + [tests.md](../sections/map-and-station-browsing/tests.md)
- **Phase 4**: [sections/price-submission-system/spec.md](../sections/price-submission-system/spec.md) + [tests.md](../sections/price-submission-system/tests.md)
- **Phase 5**: [sections/user-authentication-and-tiers/spec.md](../sections/user-authentication-and-tiers/spec.md) + [tests.md](../sections/user-authentication-and-tiers/tests.md)
- **Phase 6**: [sections/alerts-and-notifications/spec.md](../sections/alerts-and-notifications/spec.md) + [tests.md](../sections/alerts-and-notifications/tests.md)
- **Phase 7**: [sections/station-owner-dashboard/spec.md](../sections/station-owner-dashboard/spec.md) + [tests.md](../sections/station-owner-dashboard/tests.md)

---

## Phase 8: Monetization & Premium Features

### 8.1 Stripe Integration

Add to Go backend:

```bash
go get github.com/stripe/stripe-go/v74
```

Create `internal/payment/stripe.go`:

```go
package payment

import (
  "github.com/stripe/stripe-go/v74"
  "github.com/stripe/stripe-go/v74/checkout/session"
)

func CreateCheckoutSession(userID, priceID string) (*stripe.CheckoutSession, error) {
  params := &stripe.CheckoutSessionParams{
    LineItems: []*stripe.CheckoutSessionLineItemParams{
      {
        Price:    stripe.String(priceID),
        Quantity: stripe.Int64(1),
      },
    },
    Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
    SuccessURL: stripe.String("https://yourdomain.com/upgrade?success=true"),
    CancelURL:  stripe.String("https://yourdomain.com/upgrade?canceled=true"),
  }

  return session.New(params)
}
```

### 8.2 Tier-Based Feature Gating

In React components:

```typescript
const useIsPremium = () => {
  const { user } = useAuth();
  return user?.tier === 'premium';
};

// Usage:
const isPremium = useIsPremium();

if (!isPremium) {
  return (
    <div className="text-center py-8">
      <h3>This feature is Premium only</h3>
      <button onClick={() => navigate('/upgrade')}>
        Upgrade to Premium
      </button>
    </div>
  );
}
```

### 8.3 Ad Integration

For Free users, integrate ad network:

```typescript
// src/components/AdBanner.tsx
export const AdBanner: React.FC = () => {
  const { user } = useAuth();

  if (user?.tier === 'premium') {
    return null; // No ads for Premium
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 text-center">
      {/* Ad space - integrate with Google Ads, Facebook Ads, etc. */}
      <p className="text-sm text-slate-600">Advertisement</p>
    </div>
  );
};
```

---

## Testing & Deployment

### Testing Strategy

1. **Unit Tests**: Test individual functions, services, hooks
2. **Component Tests**: Test React components in isolation
3. **Integration Tests**: Test API + database interactions
4. **E2E Tests**: Full user flows (e.g., signup → map → alert → notification)

### Running Tests

```bash
# Frontend
npm run test

# Backend
go test ./...
```

### Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Security headers configured (HTTPS, CSP, etc.)
- [ ] Secrets not committed (use .env)
- [ ] API rate limiting enabled
- [ ] Logging configured
- [ ] Error monitoring (Sentry, DataDog, etc.)
- [ ] Performance monitoring
- [ ] SSL/TLS certificate installed
- [ ] Database backups automated
- [ ] CI/CD pipeline configured
- [ ] Load testing completed

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM golang:1.21-alpine

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o api cmd/api/main.go

EXPOSE 8080
CMD ["./api"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.3
    environment:
      POSTGRES_DB: gas_peep
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: gas_peep
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

---

## Success Criteria

✅ All 7 sections fully implemented  
✅ Authentication and tier system working  
✅ Map displays with real-time price data  
✅ Price submissions flow through moderation  
✅ Alerts trigger and send notifications  
✅ Station owners can broadcast messages  
✅ Premium features gated behind paywall  
✅ All tests passing  
✅ Performance acceptable (< 200ms API response)  
✅ Mobile responsive (< 768px, 768-1024px, > 1024px)  
✅ Dark mode fully functional  
✅ Error handling complete  
✅ Documentation updated  

---

**Ready to implement?** Start with Phase 1, then progress sequentially through Phases 2-7. Reference section-specific specs and tests as you build each component.
