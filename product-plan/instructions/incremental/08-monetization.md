# Phase 8: Monetization, Testing & Deployment

**Duration:** 3-4 days  
**Goal:** Implement Stripe payments, comprehensive testing, and production deployment

---

## Overview

This final phase adds:
- Stripe subscription management
- Payment processing
- End-to-end testing
- Performance optimization
- Production deployment (Docker, Kubernetes)

---

## Step 1: Backend - Stripe Integration

### 1.1 Install Stripe

```bash
go get github.com/stripe/stripe-go/v76@latest
```

### 1.2 Stripe Service

`internal/services/stripe_service.go`:

```go
package services

import (
  "github.com/stripe/stripe-go/v76"
  "github.com/stripe/stripe-go/v76/checkout/session"
  "github.com/stripe/stripe-go/v76/customer"
  "github.com/stripe/stripe-go/v76/subscription"
  "os"
)

type StripeService struct {
  apiKey string
}

func NewStripeService() *StripeService {
  stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
  return &StripeService{
    apiKey: os.Getenv("STRIPE_SECRET_KEY"),
  }
}

// CreateCheckoutSession creates a Stripe checkout for premium subscription
func (s *StripeService) CreateCheckoutSession(userID, userEmail string) (string, error) {
  params := &stripe.CheckoutSessionParams{
    PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
    LineItems: []*stripe.CheckoutSessionLineItemParams{
      {
        Price: stripe.String("price_PREMIUM_ID"), // Set up in Stripe dashboard
        Quantity: stripe.Int64(1),
      },
    },
    Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
    SuccessURL: stripe.String("https://yourapp.com/success"),
    CancelURL:  stripe.String("https://yourapp.com/cancel"),
    ClientReferenceID: stripe.String(userID),
    CustomerEmail: stripe.String(userEmail),
  }

  session, err := session.New(params)
  if err != nil {
    return "", err
  }

  return session.URL, nil
}

// HandleWebhook processes Stripe webhook events
func (s *StripeService) HandleWebhook(eventType, dataJSON string) error {
  switch eventType {
  case "customer.subscription.created":
    // Update user tier to premium
    return nil
  case "customer.subscription.deleted":
    // Downgrade user to free
    return nil
  case "charge.failed":
    // Send notification about failed payment
    return nil
  }
  return nil
}

// GetSubscriptionStatus checks if user has active premium subscription
func (s *StripeService) GetSubscriptionStatus(stripeCustomerID string) (bool, error) {
  params := &stripe.SubscriptionListParams{
    Customer: stripe.String(stripeCustomerID),
  }

  i := subscription.List(params)
  for i.Next() {
    sub := i.Subscription()
    if sub.Status == stripe.SubscriptionStatusActive {
      return true, nil
    }
  }

  return false, nil
}
```

### 1.3 Payment Handler

`internal/handlers/payment_handler.go`:

```go
package handlers

import (
  "github.com/gin-gonic/gin"
  "yourmodule/internal/services"
)

type PaymentHandler struct {
  stripeService *services.StripeService
  tierRepo      *repository.TierRepository
}

func NewPaymentHandler(
  stripeService *services.StripeService,
  tierRepo *repository.TierRepository,
) *PaymentHandler {
  return &PaymentHandler{
    stripeService: stripeService,
    tierRepo:      tierRepo,
  }
}

// POST /api/payments/create-checkout-session
func (h *PaymentHandler) CreateCheckoutSession(c *gin.Context) {
  userID := c.GetString("user_id")
  email := c.Query("email")

  url, err := h.stripeService.CreateCheckoutSession(userID, email)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to create checkout session"})
    return
  }

  c.JSON(200, gin.H{"sessionUrl": url})
}

// POST /api/payments/webhook
func (h *PaymentHandler) HandleWebhook(c *gin.Context) {
  var payload map[string]interface{}
  if err := c.ShouldBindJSON(&payload); err != nil {
    c.JSON(400, gin.H{"error": "Invalid payload"})
    return
  }

  eventType, _ := payload["type"].(string)
  dataJSON, _ := payload["data"].(string)

  if err := h.stripeService.HandleWebhook(eventType, dataJSON); err != nil {
    c.JSON(500, gin.H{"error": "Failed to process webhook"})
    return
  }

  c.JSON(200, gin.H{"received": true})
}
```

Register payment routes:

```go
paymentHandler := handlers.NewPaymentHandler(stripeService, tierRepo)

api := router.Group("/api")
{
  payments := api.Group("/payments")
  {
    payments.POST("/create-checkout-session", middleware.AuthRequired(), paymentHandler.CreateCheckoutSession)
    payments.POST("/webhook", paymentHandler.HandleWebhook) // No auth needed for webhook
  }
}
```

---

## Step 2: Frontend - Payment Integration

### 2.1 Upgrade to Premium with Stripe

`src/sections/user-authentication-and-tiers/components/TierUpgradeModal.tsx`:

```tsx
import React, { useState } from 'react';
import { Loader, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface TierUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, token } = useAuth();

  const handleUpgradeClick = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const data = await response.json();

      // Redirect to Stripe checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch (err) {
      setError('Failed to start upgrade. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-lg max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold">Upgrade to Premium</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Premium Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-lime-500">✓</span>
                <span>Custom price alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lime-500">✓</span>
                <span>Ad-free experience</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lime-500">✓</span>
                <span>Priority notifications</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lime-500">✓</span>
                <span>Advanced filters</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-bold text-2xl">$4.99</span>
              <span className="text-slate-600 dark:text-slate-400">/month</span>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgradeClick}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-lime-500 hover:bg-lime-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader size={18} className="animate-spin" />}
            {isLoading ? 'Loading...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TierUpgradeModal;
```

---

## Step 3: Comprehensive Testing

### 3.1 Unit Tests Example (Go)

`internal/repository/user_repository_test.go`:

```go
package repository

import (
  "testing"
  "yourmodule/internal/models"
)

func TestCreateUser(t *testing.T) {
  // Setup test database
  db := setupTestDB()
  defer db.Close()

  repo := NewUserRepository(db)

  // Test: Create user successfully
  user, err := repo.CreateUser("test@example.com", "hashedpass", "Test User", "free")
  if err != nil {
    t.Fatalf("CreateUser failed: %v", err)
  }

  if user.Email != "test@example.com" {
    t.Errorf("Expected email 'test@example.com', got %s", user.Email)
  }

  if user.Tier != "free" {
    t.Errorf("Expected tier 'free', got %s", user.Tier)
  }

  // Test: Duplicate email should fail
  _, err = repo.CreateUser("test@example.com", "hashedpass2", "Another User", "free")
  if err == nil {
    t.Error("Expected error for duplicate email, got none")
  }
}

func TestGetUserByEmail(t *testing.T) {
  db := setupTestDB()
  defer db.Close()

  repo := NewUserRepository(db)
  repo.CreateUser("test@example.com", "hashedpass", "Test User", "free")

  user, err := repo.GetUserByEmail("test@example.com")
  if err != nil {
    t.Fatalf("GetUserByEmail failed: %v", err)
  }

  if user.DisplayName != "Test User" {
    t.Errorf("Expected name 'Test User', got %s", user.DisplayName)
  }
}
```

### 3.2 Integration Tests Example (React)

`src/__tests__/integration/auth.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import LoginPage from '../../sections/user-authentication-and-tiers/pages/LoginPage';

describe('Authentication Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should register a new user', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>,
    );

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeTruthy();
    });
  });

  it('should log in existing user', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByText('Log In');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeTruthy();
    });
  });

  it('should fail login with wrong credentials', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    const submitButton = screen.getByText('Log In');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });
});
```

### 3.3 Setup Testing Framework

```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Step 4: Production Deployment

### 4.1 Docker Setup

`backend/Dockerfile`:

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main cmd/api/main.go

FROM alpine:latest

RUN apk --no-cache add ca-certificates postgresql-client

WORKDIR /root/

COPY --from=builder /app/main .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["./main"]
```

`frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

### 4.2 docker compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: gas_peep
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d

  backend:
    build: ./backend
    ports:
      - '8080:8080'
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: gas_peep
      PORT: 8080
      JWT_SECRET: dev-secret-key-change-in-production
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    depends_on:
      - postgres
    volumes:
      - ./uploads:/root/uploads

  frontend:
    build: ./frontend
    ports:
      - '3000:3000'
    environment:
      VITE_API_URL: http://localhost:8080
      VITE_MAPBOX_ACCESS_TOKEN: ${MAPBOX_ACCESS_TOKEN}
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 4.3 Kubernetes Deployment (Production)

`kubernetes/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gas-peep-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gas-peep-backend
  template:
    metadata:
      labels:
        app: gas-peep-backend
    spec:
      containers:
      - name: backend
        image: your-registry/gas-peep-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: gas-peep-config
              key: db_host
        - name: DB_PORT
          valueFrom:
            configMapKeyRef:
              name: gas-peep-config
              key: db_port
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: gas-peep-secrets
              key: jwt_secret
        - name: STRIPE_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: gas-peep-secrets
              key: stripe_secret_key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: gas-peep-backend-service
spec:
  selector:
    app: gas-peep-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

---

## Step 5: Performance Optimization

### 5.1 Caching Strategy

Add Redis for caching:

```bash
npm install redis
```

`src/lib/cache.ts`:

```ts
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

export async function getCachedData(key: string) {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCachedData(key: string, data: any, ttl = 3600) {
  await client.setEx(key, ttl, JSON.stringify(data));
}

export async function invalidateCache(pattern: string) {
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(keys);
  }
}
```

### 5.2 Database Query Optimization

Add indexes to frequently queried fields:

```sql
-- Already included in Phase 1 migrations
CREATE INDEX idx_stations_coordinates ON stations USING GIST (coordinates);
CREATE INDEX idx_fuel_prices_station ON fuel_prices(station_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```

### 5.3 Frontend Optimization

```bash
npm install vite-plugin-compression
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    compression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    })
  ],
})
```

---

## Step 6: Monitoring & Logging

### 6.1 Backend Logging

`internal/utils/logger.go`:

```go
package utils

import (
  "encoding/json"
  "fmt"
  "log"
  "os"
  "time"
)

type LogEntry struct {
  Timestamp string      `json:"timestamp"`
  Level     string      `json:"level"`
  Message   string      `json:"message"`
  UserID    string      `json:"userId,omitempty"`
  Error     string      `json:"error,omitempty"`
}

func LogInfo(message string) {
  log.Println(formatLog("INFO", message, "", ""))
}

func LogError(message, errMsg, userID string) {
  log.Println(formatLog("ERROR", message, errMsg, userID))
}

func formatLog(level, message, errMsg, userID string) string {
  entry := LogEntry{
    Timestamp: time.Now().RFC3339,
    Level:     level,
    Message:   message,
    UserID:    userID,
    Error:     errMsg,
  }

  data, _ := json.Marshal(entry)
  return string(data)
}
```

### 6.2 Monitoring with Prometheus (optional)

```go
// Add to main.go
import "github.com/prometheus/client_golang/prometheus/promhttp"

router.GET("/metrics", gin.WrapH(promhttp.Handler()))
```

---

## Checklist for Phase 8

- [ ] Stripe API keys configured
- [ ] Checkout session creation working
- [ ] Payment webhook handling implemented
- [ ] Upgrade to premium flow tested
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests for critical flows
- [ ] Docker images built and tested
- [ ] docker compose working locally
- [ ] Kubernetes manifests created
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] API rate limiting implemented
- [ ] HTTPS/TLS configured
- [ ] Error logging implemented
- [ ] Performance optimized
- [ ] Security audit passed
- [ ] Documentation complete

---

## Final Deployment Checklist

```bash
# Build Docker images
docker build -t gas-peep-backend ./backend
docker build -t gas-peep-frontend ./frontend

# Test locally
docker compose up

# Run all tests
npm run test
go test ./...

# Security check
npm audit
go mod verify

# Deploy to production
kubectl apply -f kubernetes/

# Verify deployment
kubectl get pods
kubectl logs -f deployment/gas-peep-backend
```

---

## Production URLs

- **Frontend**: https://app.gaspeep.com
- **API**: https://api.gaspeep.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Database**: Managed PostgreSQL with PostGIS

---

## Post-Launch Tasks

1. **Day 1**: Monitor error rates, user signup flow
2. **Week 1**: Gather initial user feedback, fix critical issues
3. **Week 2**: Optimize based on usage patterns
4. **Month 1**: Plan feature improvements and roadmap updates
5. **Ongoing**: Security patches, performance improvements, feature releases

---

## Success Criteria

✅ All 7 sections implemented and tested  
✅ User authentication and tier system working  
✅ Stripe payments processing  
✅ 95%+ API uptime maintained  
✅ < 2 second page load times  
✅ 4.5+ star app store rating  
✅ 10,000+ active users in first month  

---

## Congratulations!

You've successfully built Gas Peep, a complete fuel price community platform with:

- 5 major feature sections
- Secure user authentication
- Premium tier monetization
- Station owner business tools
- Real-time price updates
- Geospatial search capabilities
- Production-grade infrastructure

The platform is ready for launch and scaling to millions of users.

---

## Architecture Summary

```
Gas Peep Stack:
├── Frontend: React + Vite + Tailwind + Mapbox
├── Backend: Go + Gin + PostgreSQL + PostGIS
├── Auth: JWT + OAuth 2.0 (Google/Apple)
├── Payments: Stripe subscriptions
├── Infrastructure: Docker + Kubernetes + AWS/Azure
├── Monitoring: Prometheus + ELK Stack
└── CDN: CloudFront / Cloudflare
```

Good luck with Gas Peep! 🚀⛽
