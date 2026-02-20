/**
 * Alerts & Notifications - Type Definitions
 */

export type AlertStatus = 'active' | 'paused';
export type AlertRecurrenceType = 'recurring' | 'one_off';

export type NotificationType = 'alert' | 'broadcast' | 'system';

export type NotificationDeliveryMethod = 'push' | 'email' | 'sms';

export type EmailFrequency = 'immediately' | 'daily' | 'weekly';

export interface Alert {
  id: string;
  userId: string;
  name: string;
  fuelTypeId: string;
  fuelTypeName: string;
  fuelTypeColor: string;
  priceThreshold: number;
  currency: string;
  unit: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  radius: number; // in km
  radiusUnit: 'km' | 'miles';
  status: AlertStatus;
  notifyViaPush: boolean;
  notifyViaEmail: boolean;
  recurrenceType?: AlertRecurrenceType;
  createdAt: string;
  lastModifiedAt: string;
  lastTriggeredAt: string | null;
  triggerCount: number;
}

export interface AlertTrigger {
  id: string;
  alertId: string;
  stationId: string;
  stationName: string;
  stationAddress: string;
  stationLatitude: number;
  stationLongitude: number;
  price: number;
  currency: string;
  unit: string;
  triggeredAt: string;
  distanceFromAlert: number; // in km
}

export interface MatchingStation {
  stationId: string;
  stationName: string;
  stationAddress: string;
  price: number;
  currency: string;
  unit: string;
  distance: number; // in km
  lastUpdated: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  sentAt: string;
  readAt: string | null;
  expiresAt: string | null;
  data: AlertNotificationData | BroadcastNotificationData | SystemNotificationData;
}

export interface AlertNotificationData {
  type: 'alert';
  alertId: string;
  fuelTypeId: string;
  fuelTypeName: string;
  fuelTypeColor: string;
  stationId: string;
  stationName: string;
  stationAddress: string;
  stationLatitude: number;
  stationLongitude: number;
  price: number;
  threshold: number;
  currency: string;
  unit: string;
  distance: number; // from alert location
}

export interface BroadcastNotificationData {
  type: 'broadcast';
  broadcastId: string;
  stationId: string;
  stationName: string;
  stationLogo: string | null;
  stationAddress: string;
  stationLatitude: number;
  stationLongitude: number;
  promotionalMessage: string;
  validUntil: string;
  distance: number; // from user location
}

export interface SystemNotificationData {
  type: 'system';
  category: 'submission' | 'account' | 'feature';
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationPreferences {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  emailFrequency: EmailFrequency;
  smsEnabled: boolean;
  smsPhoneNumber: string | null;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  maxAlertsPerDay: number;
  minPriceDropPercentage: number;
  stationBroadcastsEnabled: boolean;
  broadcastMaxDistance: number; // in km
  accountUpdatesEnabled: boolean;
  submissionStatusEnabled: boolean;
  featureAnnouncementsEnabled: boolean;
  lastModifiedAt: string;
}

export interface FuelType {
  id: string;
  name: string;
  displayName: string;
  color: string;
  displayOrder: number;
}

export interface PriceContext {
  fuelTypeId: string;
  fuelTypeName: string;
  averagePrice: number;
  lowestPrice: number;
  lowestPriceStationName: string;
  lowestPriceStationId: string;
  currency: string;
  unit: string;
  stationCount: number; // within radius
}

export interface AlertStatistics {
  alertId: string;
  triggerCount: number;
  lastTriggeredAt: string | null;
  estimatedSavings: number; // calculated based on triggers
  currentMatchingStations: number;
}

export interface CreateAlertForm {
  step: 1 | 2 | 3;
  fuelTypeId: string | null;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  radius: number;
  radiusUnit: 'km' | 'miles';
  priceThreshold: number | null;
  alertName: string;
  notifyViaPush: boolean;
  notifyViaEmail: boolean;
  recurrenceType: AlertRecurrenceType;
}

export interface UserLocation {
  address: string;
  latitude: number;
  longitude: number;
}
