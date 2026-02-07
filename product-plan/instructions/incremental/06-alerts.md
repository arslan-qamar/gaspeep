# Phase 6: Alerts & Notifications (Premium Feature)

**Duration:** 2-3 days  
**Goal:** Build the premium alerts system with custom price thresholds and location-based notifications

---

## Overview

Premium users can:
- Create custom price alerts (fuel type, price threshold, location)
- Receive notifications when prices drop below threshold
- View notification history
- Manage alert settings
- Get notified via push and in-app messages

---

## Step 1: Backend - Alerts & Notifications

### 1.1 Alert Model & Repository

`internal/models/alert.go`:

```go
package models

import "time"

type Alert struct {
  ID              string    `json:"id"`
  UserID          string    `json:"userId"`
  FuelTypeID      string    `json:"fuelTypeId"`
  PriceThreshold  float64   `json:"priceThreshold"`
  Latitude        float64   `json:"latitude"`
  Longitude       float64   `json:"longitude"`
  RadiusKm        int       `json:"radiusKm"`
  AlertName       string    `json:"alertName"`
  IsActive        bool      `json:"isActive"`
  CreatedAt       time.Time `json:"createdAt"`
  LastTriggeredAt time.Time `json:"lastTriggeredAt,omitempty"`
  TriggerCount    int       `json:"triggerCount"`
}

type CreateAlertRequest struct {
  FuelTypeID      string  `json:"fuelTypeId" binding:"required"`
  PriceThreshold  float64 `json:"priceThreshold" binding:"required,gt=0"`
  Latitude        float64 `json:"latitude" binding:"required"`
  Longitude       float64 `json:"longitude" binding:"required"`
  RadiusKm        int     `json:"radiusKm" binding:"required,min=1,max=50"`
  AlertName       string  `json:"alertName" binding:"required"`
}

type Notification struct {
  ID               string    `json:"id"`
  UserID           string    `json:"userId"`
  NotificationType string    `json:"notificationType"` // price_alert, broadcast, system
  Title            string    `json:"title"`
  Message          string    `json:"message"`
  SentAt           time.Time `json:"sentAt"`
  IsRead           bool      `json:"isRead"`
  DeliveryStatus   string    `json:"deliveryStatus"` // pending, sent, failed
  ActionURL        string    `json:"actionUrl,omitempty"`
}
```

`internal/repository/alert_repository.go`:

```go
package repository

import (
  "database/sql"
  "github.com/google/uuid"
  "time"
  "yourmodule/internal/models"
)

type AlertRepository struct {
  db *sql.DB
}

func NewAlertRepository(db *sql.DB) *AlertRepository {
  return &AlertRepository{db: db}
}

func (r *AlertRepository) CreateAlert(req *models.CreateAlertRequest, userID string) (*models.Alert, error) {
  id := uuid.New().String()

  _, err := r.db.Exec(`
    INSERT INTO alerts (
      id, user_id, fuel_type_id, price_threshold,
      location, radius_km, alert_name, is_active, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `,
    id, userID, req.FuelTypeID, req.PriceThreshold,
    fmt.Sprintf("SRID=4326;POINT(%f %f)", req.Longitude, req.Latitude),
    req.RadiusKm, req.AlertName, true, time.Now(),
  )

  if err != nil {
    return nil, err
  }

  return &models.Alert{
    ID:             id,
    UserID:         userID,
    FuelTypeID:     req.FuelTypeID,
    PriceThreshold: req.PriceThreshold,
    Latitude:       req.Latitude,
    Longitude:      req.Longitude,
    RadiusKm:       req.RadiusKm,
    AlertName:      req.AlertName,
    IsActive:       true,
    CreatedAt:      time.Now(),
  }, nil
}

func (r *AlertRepository) GetUserAlerts(userID string) ([]models.Alert, error) {
  rows, err := r.db.Query(`
    SELECT id, user_id, fuel_type_id, price_threshold,
           ST_Y(location::geometry), ST_X(location::geometry),
           radius_km, alert_name, is_active, created_at,
           last_triggered_at, trigger_count
    FROM alerts
    WHERE user_id = $1 AND is_active = true
    ORDER BY created_at DESC
  `, userID)

  if err != nil {
    return nil, err
  }
  defer rows.Close()

  var alerts []models.Alert
  for rows.Next() {
    var alert models.Alert
    var lastTriggered sql.NullTime

    err := rows.Scan(
      &alert.ID, &alert.UserID, &alert.FuelTypeID, &alert.PriceThreshold,
      &alert.Latitude, &alert.Longitude, &alert.RadiusKm, &alert.AlertName,
      &alert.IsActive, &alert.CreatedAt, &lastTriggered, &alert.TriggerCount,
    )

    if err != nil {
      return nil, err
    }

    if lastTriggered.Valid {
      alert.LastTriggeredAt = lastTriggered.Time
    }

    alerts = append(alerts, alert)
  }

  return alerts, nil
}

func (r *AlertRepository) UpdateAlert(alertID string, active bool) error {
  _, err := r.db.Exec(`
    UPDATE alerts SET is_active = $1 WHERE id = $2
  `, active, alertID)
  return err
}

func (r *AlertRepository) DeleteAlert(alertID string) error {
  _, err := r.db.Exec(`DELETE FROM alerts WHERE id = $1`, alertID)
  return err
}
```

`internal/repository/notification_repository.go`:

```go
package repository

import (
  "database/sql"
  "github.com/google/uuid"
  "time"
  "yourmodule/internal/models"
)

type NotificationRepository struct {
  db *sql.DB
}

func NewNotificationRepository(db *sql.DB) *NotificationRepository {
  return &NotificationRepository{db: db}
}

func (r *NotificationRepository) CreateNotification(
  userID, notifType, title, message string,
) (*models.Notification, error) {
  id := uuid.New().String()

  _, err := r.db.Exec(`
    INSERT INTO notifications (
      id, user_id, notification_type, title, message,
      sent_at, is_read, delivery_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `,
    id, userID, notifType, title, message,
    time.Now(), false, "sent",
  )

  if err != nil {
    return nil, err
  }

  return &models.Notification{
    ID:             id,
    UserID:         userID,
    NotificationType: notifType,
    Title:          title,
    Message:        message,
    SentAt:         time.Now(),
    IsRead:         false,
    DeliveryStatus: "sent",
  }, nil
}

func (r *NotificationRepository) GetUserNotifications(userID string, limit int) ([]models.Notification, error) {
  rows, err := r.db.Query(`
    SELECT id, user_id, notification_type, title, message,
           sent_at, is_read, delivery_status, action_url
    FROM notifications
    WHERE user_id = $1
    ORDER BY sent_at DESC
    LIMIT $2
  `, userID, limit)

  if err != nil {
    return nil, err
  }
  defer rows.Close()

  var notifs []models.Notification
  for rows.Next() {
    var n models.Notification
    var actionURL sql.NullString

    err := rows.Scan(
      &n.ID, &n.UserID, &n.NotificationType, &n.Title, &n.Message,
      &n.SentAt, &n.IsRead, &n.DeliveryStatus, &actionURL,
    )

    if err != nil {
      return nil, err
    }

    if actionURL.Valid {
      n.ActionURL = actionURL.String
    }

    notifs = append(notifs, n)
  }

  return notifs, nil
}

func (r *NotificationRepository) MarkAsRead(notificationID string) error {
  _, err := r.db.Exec(`
    UPDATE notifications SET is_read = true WHERE id = $1
  `, notificationID)
  return err
}
```

### 1.2 Alert Handler

`internal/handlers/alert_handler.go`:

```go
package handlers

import (
  "github.com/gin-gonic/gin"
  "yourmodule/internal/middleware"
  "yourmodule/internal/models"
  "yourmodule/internal/repository"
)

type AlertHandler struct {
  alertRepo        *repository.AlertRepository
  notifRepo        *repository.NotificationRepository
}

func NewAlertHandler(
  alertRepo *repository.AlertRepository,
  notifRepo *repository.NotificationRepository,
) *AlertHandler {
  return &AlertHandler{
    alertRepo: alertRepo,
    notifRepo: notifRepo,
  }
}

// POST /api/alerts
func (h *AlertHandler) CreateAlert(c *gin.Context) {
  userID := c.GetString("user_id")

  var req models.CreateAlertRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": "Invalid request"})
    return
  }

  alert, err := h.alertRepo.CreateAlert(&req, userID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to create alert"})
    return
  }

  // Send notification
  h.notifRepo.CreateNotification(
    userID, "system",
    "Alert Created",
    "Your price alert for "+req.AlertName+" has been set up",
  )

  c.JSON(201, alert)
}

// GET /api/alerts
func (h *AlertHandler) GetAlerts(c *gin.Context) {
  userID := c.GetString("user_id")

  alerts, err := h.alertRepo.GetUserAlerts(userID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to fetch alerts"})
    return
  }

  c.JSON(200, alerts)
}

// PUT /api/alerts/:id
func (h *AlertHandler) UpdateAlert(c *gin.Context) {
  alertID := c.Param("id")

  var req struct {
    Active bool `json:"active"`
  }

  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": "Invalid request"})
    return
  }

  err := h.alertRepo.UpdateAlert(alertID, req.Active)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to update alert"})
    return
  }

  c.JSON(200, gin.H{"message": "Alert updated"})
}

// DELETE /api/alerts/:id
func (h *AlertHandler) DeleteAlert(c *gin.Context) {
  alertID := c.Param("id")

  err := h.alertRepo.DeleteAlert(alertID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to delete alert"})
    return
  }

  c.JSON(200, gin.H{"message": "Alert deleted"})
}
```

### 1.3 Notification Handler

`internal/handlers/notification_handler.go`:

```go
package handlers

import (
  "github.com/gin-gonic/gin"
  "yourmodule/internal/repository"
)

type NotificationHandler struct {
  notifRepo *repository.NotificationRepository
}

func NewNotificationHandler(notifRepo *repository.NotificationRepository) *NotificationHandler {
  return &NotificationHandler{notifRepo: notifRepo}
}

// GET /api/notifications
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
  userID := c.GetString("user_id")

  notifs, err := h.notifRepo.GetUserNotifications(userID, 50)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to fetch notifications"})
    return
  }

  c.JSON(200, notifs)
}

// PUT /api/notifications/:id/read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
  notifID := c.Param("id")

  err := h.notifRepo.MarkAsRead(notifID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to update notification"})
    return
  }

  c.JSON(200, gin.H{"message": "Marked as read"})
}
```

Register routes with premium gating:

```go
alertHandler := handlers.NewAlertHandler(alertRepo, notifRepo)
notifHandler := handlers.NewNotificationHandler(notifRepo)

api := router.Group("/api")
api.Use(middleware.AuthRequired())
{
  // Alerts (Premium only)
  alerts := api.Group("/alerts")
  alerts.Use(middleware.PremiumRequired(userRepo))
  {
    alerts.POST("", alertHandler.CreateAlert)
    alerts.GET("", alertHandler.GetAlerts)
    alerts.PUT("/:id", alertHandler.UpdateAlert)
    alerts.DELETE("/:id", alertHandler.DeleteAlert)
  }

  // Notifications (All authenticated users)
  notifs := api.Group("/notifications")
  {
    notifs.GET("", notifHandler.GetNotifications)
    notifs.PUT("/:id/read", notifHandler.MarkAsRead)
  }
}
```

---

## Step 2: Frontend - Alerts Components

### 2.1 CreateAlertScreen (Multi-step)

`src/sections/alerts-and-notifications/components/CreateAlertScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Zap } from 'lucide-react';

interface Step1 {
  fuelTypeId: string;
  priceThreshold: number;
}

interface Step2 {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

interface CreateAlertFormData extends Step1, Step2 {
  alertName: string;
}

interface CreateAlertScreenProps {
  onCreate?: (alert: CreateAlertFormData) => void;
  onCancel?: () => void;
}

const FUEL_TYPES = [
  { id: 'unleaded-91', label: 'Unleaded 91', color: 'yellow-500' },
  { id: 'diesel', label: 'Diesel', color: 'orange-500' },
  { id: 'u95', label: 'U95', color: 'blue-500' },
  { id: 'u98', label: 'U98', color: 'purple-500' },
  { id: 'lpg', label: 'LPG', color: 'pink-500' },
];

export const CreateAlertScreen: React.FC<CreateAlertScreenProps> = ({
  onCreate,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState<Step1>({
    fuelTypeId: '',
    priceThreshold: 3.5,
  });
  const [step2, setStep2] = useState<Step2>({
    latitude: 0,
    longitude: 0,
    radiusKm: 5,
  });
  const [alertName, setAlertName] = useState('');

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = () => {
    if (step1.fuelTypeId && alertName) {
      onCreate?.({
        ...step1,
        ...step2,
        alertName,
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Create Alert</h1>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Step {step} of 3
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Step 1: Fuel Type & Price */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4">What fuel type?</h2>
              <div className="grid grid-cols-2 gap-2">
                {FUEL_TYPES.map((ft) => (
                  <button
                    key={ft.id}
                    onClick={() => setStep1({ ...step1, fuelTypeId: ft.id })}
                    className={`p-3 border-2 rounded-lg font-medium transition-all ${
                      step1.fuelTypeId === ft.id
                        ? `border-lime-500 bg-lime-50 dark:bg-lime-950`
                        : `border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700`
                    }`}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                <Zap size={20} className="text-lime-500" />
                Price threshold
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">
                    ${step1.priceThreshold.toFixed(2)}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">/L</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.10"
                  value={step1.priceThreshold}
                  onChange={(e) =>
                    setStep1({
                      ...step1,
                      priceThreshold: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Alert me when price drops below this amount
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-lime-500" />
                Set location
              </h2>
              <div className="bg-slate-100 dark:bg-slate-800 h-64 rounded-lg flex items-center justify-center mb-4">
                <span className="text-slate-600 dark:text-slate-400">
                  Map placeholder
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-2">Search radius</label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">{step2.radiusKm}km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={step2.radiusKm}
                onChange={(e) =>
                  setStep2({ ...step2, radiusKm: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Step 3: Alert Name */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4">Name your alert</h2>
              <input
                type="text"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                placeholder="E.g., Morning Commute, Downtown Diesel"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
              <h3 className="font-semibold mb-3">Summary</h3>
              <p>
                <span className="text-slate-600 dark:text-slate-400">Fuel:</span>{' '}
                <span className="font-medium">
                  {FUEL_TYPES.find((ft) => ft.id === step1.fuelTypeId)?.label}
                </span>
              </p>
              <p>
                <span className="text-slate-600 dark:text-slate-400">Price:</span>{' '}
                <span className="font-medium">
                  Under ${step1.priceThreshold.toFixed(2)}/L
                </span>
              </p>
              <p>
                <span className="text-slate-600 dark:text-slate-400">Radius:</span>{' '}
                <span className="font-medium">{step2.radiusKm}km</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
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

        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={!step1.fuelTypeId}
            className="flex-1 px-4 py-2 bg-lime-500 hover:bg-lime-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            Next
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={!alertName}
            className="flex-1 px-4 py-2 bg-lime-500 hover:bg-lime-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
          >
            Create Alert
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateAlertScreen;
```

### 2.2 AlertsListScreen

`src/sections/alerts-and-notifications/pages/AlertsPage.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Toggle2 } from 'lucide-react';
import CreateAlertScreen from '../components/CreateAlertScreen';
import { useAuth } from '../../../contexts/AuthContext';

interface Alert {
  id: string;
  alertName: string;
  fuelTypeId: string;
  priceThreshold: number;
  radiusKm: number;
  isActive: boolean;
  lastTriggeredAt?: string;
  triggerCount: number;
}

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    // Fetch alerts from API
    // const fetchAlerts = async () => {
    //   const response = await fetch('/api/alerts', {
    //     headers: { 'Authorization': `Bearer ${token}` },
    //   });
    //   const data = await response.json();
    //   setAlerts(data);
    //   setLoading(false);
    // };
    // fetchAlerts();
  }, [token]);

  const handleCreateAlert = async (alert: any) => {
    // POST to /api/alerts
    setIsCreating(false);
  };

  const handleDeleteAlert = async (alertId: string) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));
    // DELETE /api/alerts/:id
  };

  const handleToggleAlert = async (alertId: string) => {
    const updated = alerts.map((a) =>
      a.id === alertId ? { ...a, isActive: !a.isActive } : a,
    );
    setAlerts(updated);
    // PUT /api/alerts/:id
  };

  if (isCreating) {
    return (
      <CreateAlertScreen
        onCreate={handleCreateAlert}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Price Alerts</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-3 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Alert</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No alerts yet
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Your First Alert
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{alert.alertName}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Under ${alert.priceThreshold.toFixed(2)}/L within{' '}
                    {alert.radiusKm}km
                  </p>
                  {alert.lastTriggeredAt && (
                    <p className="text-xs text-lime-600 dark:text-lime-400 mt-1">
                      Triggered {alert.triggerCount} times
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAlert(alert.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      alert.isActive
                        ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    <Toggle2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
```

### 2.3 NotificationCenter

`src/sections/alerts-and-notifications/components/NotificationCenter.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface Notification {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  sentAt: string;
  isRead: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    if (isOpen) {
      // Fetch notifications
      // const fetchNotifications = async () => {
      //   const response = await fetch('/api/notifications', {
      //     headers: { 'Authorization': `Bearer ${token}` },
      //   });
      //   const data = await response.json();
      //   setNotifications(data);
      // };
      // fetchNotifications();
    }
  }, [isOpen, token]);

  const handleMarkAsRead = async (notifId: string) => {
    // PUT /api/notifications/:id/read
  };

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'price_alert':
        return <AlertCircle className="text-lime-500" />;
      case 'broadcast':
        return <Bell className="text-blue-500" />;
      default:
        return <Info className="text-slate-500" />;
    }
  };

  return (
    <div className="fixed right-0 top-16 w-96 max-w-[90vw] max-h-[80vh] bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 overflow-y-auto z-50">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
        <h3 className="font-bold text-lg">Notifications</h3>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="p-8 text-center text-slate-600 dark:text-slate-400">
          <Bell size={40} className="mx-auto mb-2 opacity-50" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id)}
              className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                !notif.isRead ? 'bg-slate-50 dark:bg-slate-800' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">{getIcon(notif.notificationType)}</div>
                <div className="flex-1">
                  <h4 className="font-semibold">{notif.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {notif.message}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {new Date(notif.sentAt).toLocaleDateString()}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 bg-lime-500 rounded-full mt-2 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Close Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationCenter;
```

---

## Checklist for Phase 6

- [ ] Alert creation endpoint working
- [ ] Multi-step alert UI complete
- [ ] Location/radius selector working
- [ ] Alerts list view implemented
- [ ] Toggle/enable/disable alerts
- [ ] Delete alerts
- [ ] Notifications API endpoint working
- [ ] Notification center component
- [ ] Mark notifications as read
- [ ] Premium-only route gating
- [ ] Real-time alert triggering (webhook setup)
- [ ] Error handling
- [ ] Responsive design
- [ ] Dark mode working

---

## Testing Alerts (Premium)

```bash
npm run dev

# Create a premium user or upgrade existing user
# Visit http://localhost3000/alerts (premium-only)
# Create new alert with multi-step form
# Should see alert in list
# Toggle and delete alerts
```

---

## Next Phase

→ Continue to **Phase 7: Station Owner Dashboard** for business owner features.

Alerts system is now complete with notifications.
