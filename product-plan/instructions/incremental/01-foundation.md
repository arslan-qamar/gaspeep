# Phase 1: Foundation & Database Setup

**Duration:** 2-3 days  
**Goal:** Set up PostgreSQL database, Go backend scaffold, API error handling, and authentication basics

---

## Overview

This phase establishes the technical foundation: database schema, backend API structure, and authentication system. Everything else builds on this.

---

## Step 1: Database Setup

### 1.1 Create PostgreSQL Database with PostGIS

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql:
CREATE DATABASE gas_peep;
\c gas_peep

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
```

### 1.2 Create Database Tables

Create migration file `backend/migrations/001_create_tables.sql`:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);

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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_stations_coordinates ON stations USING GIST (coordinates);

-- Fuel types (static reference data)
CREATE TABLE fuel_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  description VARCHAR(500),
  color_code VARCHAR(50),
  display_order INT
);

-- Fuel prices (latest price per station/fuel type)
CREATE TABLE fuel_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type_id VARCHAR(50) NOT NULL REFERENCES fuel_types(id),
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  unit VARCHAR(50) DEFAULT 'liter',
  last_updated_at TIMESTAMP,
  verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
  confirmation_count INT DEFAULT 0,
  UNIQUE(station_id, fuel_type_id)
);
CREATE INDEX idx_fuel_prices_station ON fuel_prices(station_id);

-- Price submissions
CREATE TABLE price_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id),
  fuel_type_id VARCHAR(50) NOT NULL REFERENCES fuel_types(id),
  price DECIMAL(10, 2),
  submission_method VARCHAR(50) CHECK (submission_method IN ('text', 'voice', 'photo')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moderation_status VARCHAR(50) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  verification_confidence DECIMAL(3, 2),
  photo_url VARCHAR(500),
  voice_recording_url VARCHAR(500),
  ocr_data TEXT,
  moderator_notes TEXT
);
CREATE INDEX idx_submissions_user ON price_submissions(user_id);
CREATE INDEX idx_submissions_status ON price_submissions(moderation_status);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_alerts_user ON alerts(user_id);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) CHECK (notification_type IN ('price_alert', 'broadcast', 'system')),
  title VARCHAR(255),
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  action_url VARCHAR(500)
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Station owners
CREATE TABLE station_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents TEXT[],
  contact_info VARCHAR(255),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Broadcasts
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_owner_id UUID NOT NULL REFERENCES station_owners(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id),
  title VARCHAR(255),
  message TEXT,
  target_radius_km INT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  broadcast_status VARCHAR(50) DEFAULT 'scheduled' CHECK (broadcast_status IN ('scheduled', 'active', 'expired')),
  target_fuel_types VARCHAR(50)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0
);
CREATE INDEX idx_broadcasts_owner ON broadcasts(station_owner_id);
CREATE INDEX idx_broadcasts_status ON broadcasts(broadcast_status);
```

### 1.3 Seed Fuel Types

```sql
INSERT INTO fuel_types (id, name, display_name, description, color_code, display_order) VALUES
  ('e10', 'E10', 'E10', '10% ethanol blend', 'green-500', 1),
  ('unleaded-91', 'Unleaded 91', 'Unleaded 91', 'Regular unleaded gasoline', 'yellow-500', 2),
  ('diesel', 'Diesel', 'Diesel', 'Standard diesel fuel', 'orange-500', 3),
  ('premium-diesel', 'Premium Diesel', 'Premium Diesel', 'High-quality diesel', 'red-500', 4),
  ('u95', 'U95', 'U95', 'European 95 octane unleaded', 'blue-500', 5),
  ('u98', 'U98', 'U98', 'European 98 octane premium unleaded', 'purple-500', 6),
  ('lpg', 'LPG', 'LPG', 'Liquefied Petroleum Gas', 'pink-500', 7),
  ('truck-diesel', 'Truck Diesel', 'Truck Diesel', 'Heavy-duty diesel', 'orange-600', 8),
  ('adblue', 'AdBlue', 'AdBlue', 'Diesel emissions reduction fluid', 'cyan-500', 9),
  ('e85', 'E85', 'E85', '85% ethanol fuel', 'lime-500', 10),
  ('biodiesel', 'Biodiesel', 'Biodiesel', 'Renewable diesel blend', 'green-600', 11);
```

---

## Step 2: Go Backend Setup

### 2.1 Initialize Project

```bash
mkdir -p gas-peep-backend/cmd/api
mkdir -p gas-peep-backend/internal/{db,models,handlers,services,middleware,utils}
mkdir -p gas-peep-backend/migrations

cd gas-peep-backend
go mod init github.com/yourname/gas-peep-backend
```

### 2.2 Add Dependencies

```bash
go get github.com/gin-gonic/gin@v1.9.1
go get github.com/lib/pq@v1.10.9
go get github.com/golang-jwt/jwt/v5@v5.0.0
go get github.com/golang-migrate/migrate/v4@v4.16.2
go get golang.org/x/crypto@v0.14.0
go get github.com/joho/godotenv@v1.5.1
```

### 2.3 Create .env File

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
JWT_EXPIRATION_HOURS=24

# OAuth (fill in later)
GOOGLE_OAUTH_ID=
GOOGLE_OAUTH_SECRET=
APPLE_OAUTH_ID=
APPLE_OAUTH_SECRET=
```

### 2.4 Create Main Entry Point

`cmd/api/main.go`:

```go
package main

import (
  "log"
  "os"
  "github.com/gin-gonic/gin"
  "github.com/joho/godotenv"
  "database/sql"
  _ "github.com/lib/pq"
)

func main() {
  // Load environment variables
  if err := godotenv.Load(); err != nil {
    log.Println("No .env file found, using system environment")
  }

  // Initialize database
  db, err := initDB()
  if err != nil {
    log.Fatalf("Failed to connect to database: %v", err)
  }
  defer db.Close()

  // Create Gin router
  router := gin.Default()

  // Middleware
  router.Use(corsMiddleware())

  // Health check
  router.GET("/health", func(c *gin.Context) {
    c.JSON(200, gin.H{"status": "ok"})
  })

  // API routes
  setupRoutes(router, db)

  // Start server
  port := os.Getenv("PORT")
  if port == "" {
    port = "8080"
  }

  log.Printf("Starting server on :%s", port)
  if err := router.Run(":" + port); err != nil {
    log.Fatalf("Failed to start server: %v", err)
  }
}

func initDB() (*sql.DB, error) {
  dsn := os.Getenv("DB_HOST")
  db, err := sql.Open("postgres", dsn)
  if err != nil {
    return nil, err
  }

  if err = db.Ping(); err != nil {
    return nil, err
  }

  return db, nil
}

func corsMiddleware() gin.HandlerFunc {
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

func setupRoutes(router *gin.Engine, db *sql.DB) {
  // Will add routes in next phases
  // /api/auth/* - Authentication
  // /api/stations - Station management
  // /api/prices - Price data
  // /api/submissions - Price submissions
  // etc.
}
```

### 2.5 Test Database Connection

```bash
cd cmd/api
go run main.go

# Should print: "Starting server on :8080"
# Visit https://api.gaspeep.com/health
# Should return: {"status":"ok"}
```

---

## Step 3: User Authentication Foundation

### 3.1 User Model

`internal/models/user.go`:

```go
package models

import (
  "time"
)

type User struct {
  ID          string    `json:"id"`
  Email       string    `json:"email"`
  DisplayName string    `json:"displayName"`
  Tier        string    `json:"tier"`
  CreatedAt   time.Time `json:"createdAt"`
  UpdatedAt   time.Time `json:"updatedAt"`
}

type CreateUserRequest struct {
  Email       string `json:"email" binding:"required,email"`
  Password    string `json:"password" binding:"required,min=8"`
  DisplayName string `json:"displayName" binding:"required"`
  Tier        string `json:"tier" binding:"required,oneof=free premium"`
}

type LoginRequest struct {
  Email    string `json:"email" binding:"required,email"`
  Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
  User  *User  `json:"user"`
  Token string `json:"token"`
}
```

### 3.2 JWT Utils

`internal/utils/jwt.go`:

```go
package utils

import (
  "os"
  "time"
  "github.com/golang-jwt/jwt/v5"
)

func GenerateToken(userID string) (string, error) {
  secret := os.Getenv("JWT_SECRET")
  hours, _ := time.ParseDuration(os.Getenv("JWT_EXPIRATION_HOURS") + "h")

  token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
    "user_id": userID,
    "exp":     time.Now().Add(hours).Unix(),
  })

  return token.SignedString([]byte(secret))
}

func ValidateToken(tokenString string) (string, error) {
  secret := os.Getenv("JWT_SECRET")
  token, err := jwt.ParseWithClaims(tokenString, &jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
    return []byte(secret), nil
  })

  if err != nil {
    return "", err
  }

  claims := token.Claims.(*jwt.MapClaims)
  return (*claims)["user_id"].(string), nil
}
```

### 3.3 Password Hashing

`internal/utils/password.go`:

```go
package utils

import (
  "golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
  hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
  return string(hash), err
}

func VerifyPassword(hash, password string) bool {
  return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
```

### 3.4 User Repository

`internal/repository/user_repository.go`:

```go
package repository

import (
  "database/sql"
  "github.com/google/uuid"
  "yourmodule/internal/models"
)

type UserRepository struct {
  db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
  return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(email, passwordHash, displayName, tier string) (*models.User, error) {
  id := uuid.New().String()

  _, err := r.db.Exec(`
    INSERT INTO users (id, email, password_hash, display_name, tier)
    VALUES ($1, $2, $3, $4, $5)
  `, id, email, passwordHash, displayName, tier)

  if err != nil {
    return nil, err
  }

  return &models.User{
    ID:          id,
    Email:       email,
    DisplayName: displayName,
    Tier:        tier,
  }, nil
}

func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
  user := &models.User{}
  err := r.db.QueryRow(`
    SELECT id, email, display_name, tier FROM users WHERE email = $1
  `, email).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Tier)

  if err != nil {
    return nil, err
  }
  return user, nil
}

func (r *UserRepository) GetUserByID(id string) (*models.User, error) {
  user := &models.User{}
  err := r.db.QueryRow(`
    SELECT id, email, display_name, tier FROM users WHERE id = $1
  `, id).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Tier)

  if err != nil {
    return nil, err
  }
  return user, nil
}

func (r *UserRepository) GetPasswordHash(email string) (string, error) {
  var hash string
  err := r.db.QueryRow(`
    SELECT password_hash FROM users WHERE email = $1
  `, email).Scan(&hash)
  return hash, err
}
```

---

## Checklist for Phase 1

- [x] PostgreSQL database created with PostGIS
- [x] All 8 tables created with proper indexes
- [x] Fuel types seeded (11 types)
- [x] Go project initialized
- [x] Dependencies installed
- [x] .env file created with configuration
- [x] main.go created and tested (health check works)
- [x] User model defined
- [x] JWT utility functions working
- [x] Password hashing/verification working
- [x] User repository implemented and tested
- [x] Database connection tested
- [x] Can create and retrieve users from database

---

## Testing Foundation Phase

```bash
# Test database connection
psql -d gas_peep -c "SELECT * FROM fuel_types;"

# Test Go backend
cd cmd/api
go run main.go

# In another terminal
curl https://api.gaspeep.com/health
# Should return: {"status":"ok"}
```

---

## Next Phase

→ Continue to **Phase 2: Application Shell & Navigation** once foundation is solid.

Database and authentication basics are now ready for the frontend and remaining backend endpoints.
