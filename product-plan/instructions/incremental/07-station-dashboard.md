# Phase 7: Station Owner Dashboard

**Duration:** 2-3 days  
**Goal:** Build the dashboard for verified station owners to claim stations and broadcast promotions

---

## Overview

Station owners can:
- Verify ownership (3-step process)
- Claim stations
- Create and schedule promotions
- View broadcast history and analytics
- Manage station prices

---

## Step 1: Backend - Station Owner Setup

### 1.1 StationOwner Model & Repository

`internal/models/owner.go`:

```go
package models

import "time"

type StationOwner struct {
  ID                   string    `json:"id"`
  UserID               string    `json:"userId"`
  BusinessName         string    `json:"businessName"`
  VerificationStatus   string    `json:"verificationStatus"` // pending, verified, rejected
  VerificationDocuments []string `json:"verificationDocuments"`
  ContactInfo          string    `json:"contactInfo"`
  VerifiedAt           time.Time `json:"verifiedAt,omitempty"`
  CreatedAt            time.Time `json:"createdAt"`
}

type Broadcast struct {
  ID            string    `json:"id"`
  StationOwnerID string   `json:"stationOwnerId"`
  StationID     string    `json:"stationId"`
  Title         string    `json:"title"`
  Message       string    `json:"message"`
  TargetRadiusKm int      `json:"targetRadiusKm"`
  StartDate     time.Time `json:"startDate"`
  EndDate       time.Time `json:"endDate"`
  Status        string    `json:"status"` // scheduled, active, expired
  TargetFuelTypes []string `json:"targetFuelTypes"`
  CreatedAt     time.Time `json:"createdAt"`
  Views         int       `json:"views"`
  Clicks        int       `json:"clicks"`
}

type ClaimStationRequest struct {
  StationID string `json:"stationId" binding:"required"`
  Name      string `json:"name" binding:"required"`
  Email     string `json:"email" binding:"required,email"`
  Phone     string `json:"phone" binding:"required"`
}

type CreateBroadcastRequest struct {
  StationID      string    `json:"stationId" binding:"required"`
  Title          string    `json:"title" binding:"required,max=100"`
  Message        string    `json:"message" binding:"required,max=500"`
  TargetRadiusKm int       `json:"targetRadiusKm" binding:"required,min=1,max=50"`
  StartDate      time.Time `json:"startDate" binding:"required"`
  EndDate        time.Time `json:"endDate" binding:"required"`
  TargetFuelTypes []string `json:"targetFuelTypes"`
}
```

`internal/repository/owner_repository.go`:

```go
package repository

import (
  "database/sql"
  "github.com/google/uuid"
  "time"
  "yourmodule/internal/models"
)

type OwnerRepository struct {
  db *sql.DB
}

func NewOwnerRepository(db *sql.DB) *OwnerRepository {
  return &OwnerRepository{db: db}
}

func (r *OwnerRepository) CreateStationOwner(userID, businessName, contactInfo string) (*models.StationOwner, error) {
  id := uuid.New().String()

  _, err := r.db.Exec(`
    INSERT INTO station_owners (id, user_id, business_name, verification_status, contact_info, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, id, userID, businessName, "pending", contactInfo, time.Now())

  if err != nil {
    return nil, err
  }

  return &models.StationOwner{
    ID:                 id,
    UserID:             userID,
    BusinessName:       businessName,
    VerificationStatus: "pending",
    ContactInfo:        contactInfo,
    CreatedAt:          time.Now(),
  }, nil
}

func (r *OwnerRepository) GetStationOwnerByUserID(userID string) (*models.StationOwner, error) {
  owner := &models.StationOwner{}
  err := r.db.QueryRow(`
    SELECT id, user_id, business_name, verification_status, contact_info, created_at
    FROM station_owners WHERE user_id = $1
  `, userID).Scan(
    &owner.ID, &owner.UserID, &owner.BusinessName,
    &owner.VerificationStatus, &owner.ContactInfo, &owner.CreatedAt,
  )

  if err != nil {
    return nil, err
  }
  return owner, nil
}

func (r *OwnerRepository) VerifyStationOwner(ownerID string) error {
  _, err := r.db.Exec(`
    UPDATE station_owners
    SET verification_status = $1, verified_at = $2
    WHERE id = $3
  `, "verified", time.Now(), ownerID)
  return err
}
```

`internal/repository/broadcast_repository.go`:

```go
package repository

import (
  "database/sql"
  "github.com/google/uuid"
  "time"
  "yourmodule/internal/models"
)

type BroadcastRepository struct {
  db *sql.DB
}

func NewBroadcastRepository(db *sql.DB) *BroadcastRepository {
  return &BroadcastRepository{db: db}
}

func (r *BroadcastRepository) CreateBroadcast(req *models.CreateBroadcastRequest, stationOwnerID string) (*models.Broadcast, error) {
  id := uuid.New().String()

  _, err := r.db.Exec(`
    INSERT INTO broadcasts (
      id, station_owner_id, station_id, title, message,
      target_radius_km, start_date, end_date, broadcast_status, target_fuel_types, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `,
    id, stationOwnerID, req.StationID, req.Title, req.Message,
    req.TargetRadiusKm, req.StartDate, req.EndDate, "scheduled",
    req.TargetFuelTypes, time.Now(),
  )

  if err != nil {
    return nil, err
  }

  return &models.Broadcast{
    ID:            id,
    StationOwnerID: stationOwnerID,
    StationID:     req.StationID,
    Title:         req.Title,
    Message:       req.Message,
    TargetRadiusKm: req.TargetRadiusKm,
    StartDate:     req.StartDate,
    EndDate:       req.EndDate,
    Status:        "scheduled",
    CreatedAt:     time.Now(),
  }, nil
}

func (r *BroadcastRepository) GetOwnerBroadcasts(stationOwnerID string) ([]models.Broadcast, error) {
  rows, err := r.db.Query(`
    SELECT id, station_owner_id, station_id, title, message,
           target_radius_km, start_date, end_date, broadcast_status,
           target_fuel_types, created_at, views, clicks
    FROM broadcasts
    WHERE station_owner_id = $1
    ORDER BY created_at DESC
  `, stationOwnerID)

  if err != nil {
    return nil, err
  }
  defer rows.Close()

  var broadcasts []models.Broadcast
  for rows.Next() {
    var b models.Broadcast
    var fuelTypes sql.NullString

    err := rows.Scan(
      &b.ID, &b.StationOwnerID, &b.StationID, &b.Title, &b.Message,
      &b.TargetRadiusKm, &b.StartDate, &b.EndDate, &b.Status,
      &fuelTypes, &b.CreatedAt, &b.Views, &b.Clicks,
    )

    if err != nil {
      return nil, err
    }

    broadcasts = append(broadcasts, b)
  }

  return broadcasts, nil
}
```

### 1.2 Owner Handler

`internal/handlers/owner_handler.go`:

```go
package handlers

import (
  "github.com/gin-gonic/gin"
  "yourmodule/internal/models"
  "yourmodule/internal/repository"
)

type OwnerHandler struct {
  ownerRepo      *repository.OwnerRepository
  broadcastRepo  *repository.BroadcastRepository
}

func NewOwnerHandler(
  ownerRepo *repository.OwnerRepository,
  broadcastRepo *repository.BroadcastRepository,
) *OwnerHandler {
  return &OwnerHandler{
    ownerRepo:     ownerRepo,
    broadcastRepo: broadcastRepo,
  }
}

// POST /api/owner/register
func (h *OwnerHandler) RegisterOwner(c *gin.Context) {
  userID := c.GetString("user_id")

  var req struct {
    BusinessName string `json:"businessName" binding:"required"`
    ContactInfo  string `json:"contactInfo" binding:"required"`
  }

  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": "Invalid request"})
    return
  }

  owner, err := h.ownerRepo.CreateStationOwner(userID, req.BusinessName, req.ContactInfo)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to register as owner"})
    return
  }

  c.JSON(201, owner)
}

// GET /api/owner/profile
func (h *OwnerHandler) GetOwnerProfile(c *gin.Context) {
  userID := c.GetString("user_id")

  owner, err := h.ownerRepo.GetStationOwnerByUserID(userID)
  if err != nil {
    c.JSON(404, gin.H{"error": "Owner profile not found"})
    return
  }

  c.JSON(200, owner)
}

// POST /api/owner/broadcasts
func (h *OwnerHandler) CreateBroadcast(c *gin.Context) {
  userID := c.GetString("user_id")

  owner, err := h.ownerRepo.GetStationOwnerByUserID(userID)
  if err != nil || owner.VerificationStatus != "verified" {
    c.JSON(403, gin.H{"error": "Owner must be verified to create broadcasts"})
    return
  }

  var req models.CreateBroadcastRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": "Invalid request"})
    return
  }

  broadcast, err := h.broadcastRepo.CreateBroadcast(&req, owner.ID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to create broadcast"})
    return
  }

  c.JSON(201, broadcast)
}

// GET /api/owner/broadcasts
func (h *OwnerHandler) GetBroadcasts(c *gin.Context) {
  userID := c.GetString("user_id")

  owner, err := h.ownerRepo.GetStationOwnerByUserID(userID)
  if err != nil {
    c.JSON(404, gin.H{"error": "Owner not found"})
    return
  }

  broadcasts, err := h.broadcastRepo.GetOwnerBroadcasts(owner.ID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to fetch broadcasts"})
    return
  }

  c.JSON(200, broadcasts)
}
```

Register owner routes:

```go
ownerHandler := handlers.NewOwnerHandler(ownerRepo, broadcastRepo)

api := router.Group("/api")
api.Use(middleware.AuthRequired())
{
  owner := api.Group("/owner")
  {
    owner.POST("/register", ownerHandler.RegisterOwner)
    owner.GET("/profile", ownerHandler.GetOwnerProfile)
    owner.POST("/broadcasts", ownerHandler.CreateBroadcast)
    owner.GET("/broadcasts", ownerHandler.GetBroadcasts)
  }
}
```

---

## Step 2: Frontend - Owner Dashboard Components

### 2.1 StationOwnerDashboard

`src/sections/station-owner-dashboard/pages/DashboardPage.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { Plus, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface OwnerProfile {
  id: string;
  businessName: string;
  verificationStatus: string;
  contactInfo: string;
}

interface Broadcast {
  id: string;
  title: string;
  message: string;
  status: string;
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
}

export const DashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'broadcasts' | 'analytics'>('broadcasts');
  const { token } = useAuth();

  useEffect(() => {
    // Fetch owner profile and broadcasts
    // const fetchData = async () => {
    //   const profileRes = await fetch('/api/owner/profile', {
    //     headers: { 'Authorization': `Bearer ${token}` },
    //   });
    //   const profile = await profileRes.json();
    //   setProfile(profile);

    //   const broadcastsRes = await fetch('/api/owner/broadcasts', {
    //     headers: { 'Authorization': `Bearer ${token}` },
    //   });
    //   const broadcasts = await broadcastsRes.json();
    //   setBroadcasts(broadcasts);
    //   setLoading(false);
    // };
    // fetchData();
  }, [token]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 p-4">
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">
            Becoming a station owner...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{profile.businessName}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Verification Status:{' '}
                <span
                  className={`font-semibold ${
                    profile.verificationStatus === 'verified'
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {profile.verificationStatus}
                </span>
              </p>
            </div>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Settings size={24} />
            </button>
          </div>

          {/* Verification Warning */}
          {profile.verificationStatus !== 'verified' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              Your account is pending verification. You can view broadcasts once verified.
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-4">
        <div className="max-w-6xl mx-auto flex gap-8">
          <button
            onClick={() => setTab('broadcasts')}
            className={`py-4 px-2 font-semibold border-b-2 transition-colors ${
              tab === 'broadcasts'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            Broadcasts
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`py-4 px-2 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'analytics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {tab === 'broadcasts' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Your Broadcasts</h2>
                {profile.verificationStatus === 'verified' && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                    <Plus size={20} />
                    New Broadcast
                  </button>
                )}
              </div>

              {broadcasts.length === 0 ? (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                  <p>No broadcasts yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {broadcasts.map((broadcast) => (
                    <div
                      key={broadcast.id}
                      className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:shadow-md dark:hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{broadcast.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {broadcast.message}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            broadcast.status === 'active'
                              ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                              : broadcast.status === 'scheduled'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {broadcast.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-slate-600 dark:text-slate-400">
                          Views: <span className="font-semibold">{broadcast.views}</span> • Clicks:{' '}
                          <span className="font-semibold">{broadcast.clicks}</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {new Date(broadcast.startDate).toLocaleDateString()} to{' '}
                          {new Date(broadcast.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'analytics' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Analytics Overview</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Total Views</p>
                  <p className="text-3xl font-bold mt-2">
                    {broadcasts.reduce((sum, b) => sum + b.views, 0)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Total Clicks</p>
                  <p className="text-3xl font-bold mt-2">
                    {broadcasts.reduce((sum, b) => sum + b.clicks, 0)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Click Rate</p>
                  <p className="text-3xl font-bold mt-2">
                    {broadcasts.length > 0
                      ? (
                          (broadcasts.reduce((sum, b) => sum + b.clicks, 0) /
                            broadcasts.reduce((sum, b) => sum + b.views, 0)) *
                          100
                        ).toFixed(2)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
```

### 2.2 ClaimStationScreen (3-step verification)

`src/sections/station-owner-dashboard/components/ClaimStationScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

type Step = 1 | 2 | 3;

interface ClaimData {
  stationId: string;
  name: string;
  email: string;
  phone: string;
}

interface ClaimStationScreenProps {
  onClaim?: (data: ClaimData) => void;
  onCancel?: () => void;
}

export const ClaimStationScreen: React.FC<ClaimStationScreenProps> = ({
  onClaim,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<ClaimData>({
    stationId: '',
    name: '',
    email: '',
    phone: '',
  });

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step);
    } else {
      onClaim?.(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4">
        <h1 className="text-xl font-bold">Claim Your Station</h1>
      </div>

      {/* Progress Indicators */}
      <div className="bg-white dark:bg-slate-900 px-4 py-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  s <= step
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {s < step ? <CheckCircle size={24} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Step 1: Station Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold mb-4">Which station are you claiming?</h2>
              <input
                type="text"
                placeholder="Search or select station"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Can't find your station? You'll be able to add a new one after claiming existing ones.
              </div>
            </div>
          )}

          {/* Step 2: Business Information */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold mb-4">Your Business Information</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Business/Owner Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold mb-4">Verification</h2>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  We'll send a verification code to your email and phone. Please confirm both to verify your station ownership.
                </p>
              </div>
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-sm font-medium">Summary</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Name: {formData.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Email: {formData.email}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Phone: {formData.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-4 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
        >
          Cancel
        </button>

        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20} />
            Back
          </button>
        )}

        <button
          onClick={handleNext}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {step === 3 ? 'Claim Station' : 'Next'}
          {step < 3 && <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ClaimStationScreen;
```

### 2.3 CreateBroadcastScreen

`src/sections/station-owner-dashboard/components/CreateBroadcastScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface BroadcastData {
  stationId: string;
  title: string;
  message: string;
  targetRadiusKm: number;
  startDate: string;
  endDate: string;
  targetFuelTypes: string[];
}

interface CreateBroadcastScreenProps {
  onCreate?: (broadcast: BroadcastData) => void;
  onCancel?: () => void;
}

const FUEL_TYPES = ['unleaded-91', 'diesel', 'u95', 'u98', 'lpg'];

export const CreateBroadcastScreen: React.FC<CreateBroadcastScreenProps> = ({
  onCreate,
  onCancel,
}) => {
  const [formData, setFormData] = useState<BroadcastData>({
    stationId: '',
    title: '',
    message: '',
    targetRadiusKm: 5,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetFuelTypes: [],
  });

  const handleSubmit = () => {
    if (formData.title && formData.message) {
      onCreate?.(formData);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Create Broadcast</h1>
      </div>

      {/* Form */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="E.g., Happy Hour Special"
              maxLength={100}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="E.g., Get 10% off diesel all day!"
              maxLength={500}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
            />
          </div>

          {/* Target Radius */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Delivery Radius: {formData.targetRadiusKm}km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={formData.targetRadiusKm}
              onChange={(e) =>
                setFormData({ ...formData, targetRadiusKm: parseInt(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Fuel Types */}
          <div>
            <label className="block text-sm font-medium mb-2">Target Fuel Types</label>
            <div className="grid grid-cols-2 gap-2">
              {FUEL_TYPES.map((ft) => (
                <label key={ft} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.targetFuelTypes.includes(ft)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          targetFuelTypes: [...formData.targetFuelTypes, ft],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          targetFuelTypes: formData.targetFuelTypes.filter((f) => f !== ft),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm capitalize">{ft.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-4 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.title || !formData.message}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
        >
          Create Broadcast
        </button>
      </div>
    </div>
  );
};

export default CreateBroadcastScreen;
```

---

## Checklist for Phase 7

- [ ] Station owner model and repository
- [ ] Broadcast model and repository
- [ ] Owner registration endpoint
- [ ] Get owner profile endpoint
- [ ] Create broadcast endpoint
- [ ] Get broadcasts endpoint
- [ ] Dashboard layout and tabs
- [ ] Broadcasts list view
- [ ] Analytics overview
- [ ] ClaimStationScreen (3-step UI)
- [ ] CreateBroadcastScreen
- [ ] Form validation
- [ ] Error handling
- [ ] Responsive design
- [ ] Dark mode working

---

## Testing Owner Dashboard

```bash
npm run dev

# Create owner account
# Complete 3-step station claiming process
# Create broadcasts
# View dashboard and analytics
```

---

## Next Phase

→ Continue to **Phase 8: Monetization & Deployment** for Stripe integration and production setup.

Station owner features are now complete.
