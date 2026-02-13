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

/**
 * Fetch all alerts for the current user
 */
export const fetchUserAlerts = async (): Promise<Alert[]> => {
  const response = await apiClient.get('/alerts');
  return response.data;
};

/**
 * Fetch a specific alert by ID
 */
export const fetchAlertById = async (alertId: string): Promise<Alert> => {
  const response = await apiClient.get(`/alerts/${alertId}`);
  return response.data;
};

/**
 * Create a new price alert
 */
export const createAlert = async (payload: CreateAlertPayload): Promise<Alert> => {
  const response = await apiClient.post('/alerts', payload);
  return response.data;
};

/**
 * Update an existing alert
 */
export const updateAlert = async (
  alertId: string,
  payload: UpdateAlertPayload
): Promise<Alert> => {
  const response = await apiClient.put(`/alerts/${alertId}`, payload);
  return response.data;
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
  const response = await apiClient.put(`/alerts/${alertId}`, {
    status: isActive ? 'active' : 'paused',
  });
  return response.data;
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
