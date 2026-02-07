/**
 * Gas Peep - Core TypeScript Types
 * 
 * These interfaces define the shape of all data entities in Gas Peep.
 * Use these types throughout the application for type safety and consistency.
 */

// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
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

export interface AuthContext {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  displayName: string;
  tier: 'free' | 'premium';
}

// ============================================================================
// Stations & Locations
// ============================================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  coordinates: Coordinates;
  operatingHours: string;
  amenities: string[];
  lastVerifiedDate: Date;
  distanceFromUser?: number; // Client-side calculation
}

export interface StationDetail extends Station {
  fuelPrices: FuelPrice[];
  submissionCount: number;
}

// ============================================================================
// Fuel Types & Prices
// ============================================================================

export const FUEL_TYPE_IDS = [
  'e10',
  'unleaded-91',
  'diesel',
  'premium-diesel',
  'u95',
  'u98',
  'lpg',
  'truck-diesel',
  'adblue',
  'e85',
  'biodiesel',
] as const;

export interface FuelType {
  id: typeof FUEL_TYPE_IDS[number];
  name: string;
  displayName: string;
  description: string;
  colorCode: string;
  displayOrder: number;
}

export interface FuelPrice {
  id: string;
  stationId: string;
  fuelTypeId: typeof FUEL_TYPE_IDS[number];
  price: number;
  currency: string;
  unit: string;
  lastUpdatedAt: Date;
  verificationStatus: 'unverified' | 'verified' | 'rejected';
  confirmationCount: number;
}

// ============================================================================
// Price Submissions
// ============================================================================

export interface PriceSubmission {
  id: string;
  userId: string;
  stationId: string;
  fuelTypeId: typeof FUEL_TYPE_IDS[number];
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

export interface PriceSubmissionPayload {
  stationId: string;
  fuelTypeId: typeof FUEL_TYPE_IDS[number];
  price: number;
  submissionMethod: 'text' | 'voice' | 'photo';
  photoUrl?: string;
  voiceRecordingUrl?: string;
  ocrData?: string;
}

// ============================================================================
// Alerts & Notifications
// ============================================================================

export interface Alert {
  id: string;
  userId: string;
  fuelTypeId: typeof FUEL_TYPE_IDS[number];
  priceThreshold: number;
  location: Coordinates;
  radiusKm: number;
  alertName: string;
  isActive: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  triggerCount: number;
}

export interface AlertPayload {
  fuelTypeId: typeof FUEL_TYPE_IDS[number];
  priceThreshold: number;
  location: Coordinates;
  radiusKm: number;
  alertName: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'price_alert' | 'broadcast' | 'system';
  title: string;
  message: string;
  sentAt: Date;
  isRead: boolean;
  deliveryStatus: 'pending' | 'sent' | 'failed';
  actionUrl?: string;
  alertId?: string;
  broadcastId?: string;
}

// ============================================================================
// Station Owner & Broadcasts
// ============================================================================

export interface StationOwner {
  id: string;
  userId: string;
  businessName: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments: string[];
  contactInfo: string;
  verifiedAt?: Date;
}

export interface Broadcast {
  id: string;
  stationOwnerId: string;
  stationId: string;
  title: string;
  message: string;
  targetRadiusKm: number;
  startDate: Date;
  endDate: Date;
  broadcastStatus: 'scheduled' | 'active' | 'expired';
  targetFuelTypes?: typeof FUEL_TYPE_IDS[number][];
  createdAt: Date;
  engagementMetrics: {
    views: number;
    clicks: number;
  };
}

export interface BroadcastPayload {
  stationId: string;
  title: string;
  message: string;
  targetRadiusKm: number;
  startDate: Date;
  endDate: Date;
  targetFuelTypes?: typeof FUEL_TYPE_IDS[number][];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Filter & Query Types
// ============================================================================

export interface MapFilter {
  fuelTypes: typeof FUEL_TYPE_IDS[number][];
  priceRangeMin?: number;
  priceRangeMax?: number;
  radiusKm?: number;
}

export interface StationSearchQuery {
  query?: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  fuelTypes?: typeof FUEL_TYPE_IDS[number][];
}

// ============================================================================
// UI State Types
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface MapState {
  selectedStationId?: string;
  filters: MapFilter;
  userLocation?: Coordinates;
  zoomLevel: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface SubmissionState {
  method: 'text' | 'voice' | 'photo';
  selectedStation?: Station;
  selectedFuelType?: typeof FUEL_TYPE_IDS[number];
  price?: number;
  isSubmitting: boolean;
  error?: string;
}
