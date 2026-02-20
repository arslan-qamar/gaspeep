import { apiClient } from '../../../lib/api';
import type {
  Alert,
  AlertTrigger,
  Notification,
  NotificationPreferences,
  FuelType,
  PriceContext,
  AlertStatistics,
  MatchingStation,
} from '../types';

/**
 * Alerts API Service
 * Handles all API calls related to price alerts
 */

export interface CreateAlertPayload {
  name: string;
  fuelTypeId: string;
  priceThreshold: number;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  radius: number;
  radiusUnit: 'km' | 'miles';
  notifyViaPush: boolean;
  notifyViaEmail: boolean;
}

export interface UpdateAlertPayload extends Partial<CreateAlertPayload> {
  status?: 'active' | 'paused';
}

interface BackendAlert {
  id: string;
  userId: string;
  fuelTypeId: string;
  priceThreshold: number;
  latitude: number;
  longitude: number;
  radiusKm: number;
  alertName: string;
  notifyViaPush: boolean;
  notifyViaEmail: boolean;
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
  triggerCount: number;
}

interface BackendCreateAlertPayload {
  fuelTypeId: string;
  priceThreshold: number;
  latitude: number;
  longitude: number;
  radiusKm: number;
  alertName: string;
  notifyViaPush: boolean;
  notifyViaEmail: boolean;
}

interface BackendUpdateAlertPayload {
  priceThreshold?: number;
  radiusKm?: number;
  alertName?: string;
  notifyViaPush?: boolean;
  notifyViaEmail?: boolean;
  isActive?: boolean;
}

const toBackendRadiusKm = (radius: number, radiusUnit: 'km' | 'miles'): number => {
  if (radiusUnit === 'miles') {
    return Math.max(1, Math.round(radius * 1.60934));
  }
  return radius;
};

const mapBackendAlertToFrontend = (alert: BackendAlert): Alert => ({
  id: alert.id,
  userId: alert.userId,
  name: alert.alertName,
  fuelTypeId: alert.fuelTypeId,
  // Backend does not currently enrich alerts with fuel metadata.
  fuelTypeName: alert.fuelTypeId,
  fuelTypeColor: '#2563eb',
  priceThreshold: alert.priceThreshold,
  currency: 'AUD',
  unit: 'L',
  location: {
    address: `(${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)})`,
    latitude: alert.latitude,
    longitude: alert.longitude,
  },
  radius: alert.radiusKm,
  radiusUnit: 'km',
  status: alert.isActive ? 'active' : 'paused',
  notifyViaPush: alert.notifyViaPush,
  notifyViaEmail: alert.notifyViaEmail,
  createdAt: alert.createdAt,
  lastModifiedAt: alert.createdAt,
  lastTriggeredAt: alert.lastTriggeredAt,
  triggerCount: alert.triggerCount,
});

/**
 * Fetch all alerts for the current user
 */
export const fetchUserAlerts = async (): Promise<Alert[]> => {
  const response = await apiClient.get<BackendAlert[]>('/alerts');
  return response.data.map(mapBackendAlertToFrontend);
};

/**
 * Fetch a specific alert by ID
 */
export const fetchAlertById = async (alertId: string): Promise<Alert> => {
  // Backend currently only supports GET /alerts, so derive one alert from that list.
  const alerts = await fetchUserAlerts();
  const alert = alerts.find((item) => item.id === alertId);
  if (!alert) {
    throw new Error(`Alert ${alertId} not found`);
  }
  return alert;
};

/**
 * Create a new price alert
 */
export const createAlert = async (payload: CreateAlertPayload): Promise<Alert> => {
  const backendPayload: BackendCreateAlertPayload = {
    fuelTypeId: payload.fuelTypeId,
    priceThreshold: payload.priceThreshold,
    latitude: payload.location.latitude,
    longitude: payload.location.longitude,
    radiusKm: toBackendRadiusKm(payload.radius, payload.radiusUnit),
    alertName: payload.name,
    notifyViaPush: payload.notifyViaPush,
    notifyViaEmail: payload.notifyViaEmail,
  };
  const response = await apiClient.post<BackendAlert>('/alerts', backendPayload);
  return mapBackendAlertToFrontend(response.data);
};

/**
 * Update an existing alert
 */
export const updateAlert = async (
  alertId: string,
  payload: UpdateAlertPayload
): Promise<Alert> => {
  const backendPayload: BackendUpdateAlertPayload = {};
  if (payload.priceThreshold !== undefined) {
    backendPayload.priceThreshold = payload.priceThreshold;
  }
  if (payload.radius !== undefined) {
    backendPayload.radiusKm = toBackendRadiusKm(
      payload.radius,
      payload.radiusUnit ?? 'km'
    );
  }
  if (payload.name !== undefined) {
    backendPayload.alertName = payload.name;
  }
  if (payload.status !== undefined) {
    backendPayload.isActive = payload.status === 'active';
  }
  if (payload.notifyViaPush !== undefined) {
    backendPayload.notifyViaPush = payload.notifyViaPush;
  }
  if (payload.notifyViaEmail !== undefined) {
    backendPayload.notifyViaEmail = payload.notifyViaEmail;
  }

  await apiClient.put(`/alerts/${alertId}`, backendPayload);
  // API returns only id/message for update; re-read the alert from list.
  return fetchAlertById(alertId);
};

/**
 * Delete an alert
 */
export const deleteAlert = async (alertId: string): Promise<void> => {
  await apiClient.delete(`/alerts/${alertId}`);
};

/**
 * Toggle alert status (active/paused)
 */
export const toggleAlertStatus = async (
  alertId: string,
  isActive: boolean
): Promise<Alert> => {
  await apiClient.put(`/alerts/${alertId}`, {
    isActive,
  });
  return fetchAlertById(alertId);
};

/**
 * Fetch trigger history for an alert
 */
export const fetchAlertTriggers = async (alertId: string): Promise<AlertTrigger[]> => {
  const response = await apiClient.get(`/alerts/${alertId}/triggers`);
  return response.data;
};

/**
 * Fetch statistics for an alert
 */
export const fetchAlertStatistics = async (alertId: string): Promise<AlertStatistics> => {
  const response = await apiClient.get(`/alerts/${alertId}/statistics`);
  return response.data;
};

/**
 * Fetch stations currently matching alert threshold
 */
export const fetchMatchingStations = async (alertId: string): Promise<MatchingStation[]> => {
  const response = await apiClient.get(`/alerts/${alertId}/matching-stations`);
  return response.data;
};

/**
 * Fetch all notifications for the current user
 */
export const fetchNotifications = async (
  type?: 'alert' | 'broadcast' | 'system'
): Promise<Notification[]> => {
  const response = await apiClient.get('/notifications', {
    params: { type },
  });
  return response.data;
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.put(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.put('/notifications/read-all');
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await apiClient.delete(`/notifications/${notificationId}`);
};

/**
 * Fetch notification preferences
 */
export const fetchNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await apiClient.get('/notifications/preferences');
  return response.data;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const response = await apiClient.put('/notifications/preferences', preferences);
  return response.data;
};

/**
 * Fetch available fuel types
 */
export const fetchFuelTypes = async (): Promise<FuelType[]> => {
  const response = await apiClient.get('/fuel-types');
  return response.data;
};

/**
 * Fetch price context for creating alerts (average, lowest prices)
 */
export const fetchPriceContext = async (
  fuelTypeId: string,
  latitude: number,
  longitude: number,
  radius: number
): Promise<PriceContext> => {
  const response = await apiClient.post('/alerts/price-context', {
    fuelTypeId,
    latitude,
    longitude,
    radius,
  });
  return response.data;
};
