/**
 * Station Owner Dashboard - Type Definitions
 */

export type VerificationStatus = 'verified' | 'pending' | 'rejected' | 'not_verified';

export type StationOwnerPlan = 'basic' | 'premium' | 'enterprise';

export type BroadcastStatus = 'draft' | 'scheduled' | 'active' | 'expired';

export type PromotionType = 'price_drop' | 'special_discount' | 'limited_time_offer' | 'new_service' | 'general_announcement';

export type ClaimStatus = 'available' | 'claimed' | 'pending';

export type VerificationMethod = 'document' | 'phone' | 'email';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface StationOwner {
  id: string;
  userId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  plan: StationOwnerPlan;
  broadcastsThisWeek: number;
  broadcastLimit: number;
  accountCreatedAt: string;
}

export interface OperatingHours {
  open: string; // HH:mm format
  close: string; // HH:mm format
  is24Hour: boolean;
}

export interface ClaimedStation {
  id: string;
  ownerId: string;
  name: string;
  brand: string;
  brandLogo: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  operatingHours: Record<DayOfWeek, OperatingHours>;
  amenities: string[];
  photos: string[];
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  claimedAt: string;
  lastBroadcastAt: string | null;
}

export interface Broadcast {
  id: string;
  stationId: string;
  stationName: string;
  ownerId: string;
  title: string;
  message: string;
  promotionType: PromotionType;
  fuelTypes: string[]; // Array of fuel type IDs
  targetRadius: number;
  radiusUnit: 'km' | 'miles';
  estimatedRecipients: number;
  actualRecipients: number;
  status: BroadcastStatus;
  createdAt: string;
  scheduledFor: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  delivered: number;
  opened: number;
  clickedThrough: number;
}

export interface DashboardStats {
  totalStations: number;
  verifiedStations: number;
  activeBroadcasts: number;
  totalReachThisMonth: number;
  averageEngagementRate: number; // Percentage
  broadcastsThisWeek: number;
  broadcastLimit: number;
}

export interface FuelType {
  id: string;
  name: string;
  color: string;
}

export interface AvailableStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in km
  claimStatus: ClaimStatus;
}

export interface VerificationRequest {
  id: string;
  stationId: string;
  ownerId: string;
  method: VerificationMethod;
  documentUrls?: string[];
  phoneNumber?: string;
  email?: string;
  verificationCode?: string;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  notes: string | null;
}

export interface FuelPrice {
  fuelTypeId: string;
  fuelTypeName: string;
  price: number;
  lastUpdated: string;
}

export interface BroadcastEngagementMetric {
  timestamp: string;
  delivered: number;
  opened: number;
  clickedThrough: number;
}

export interface CreateBroadcastFormData {
  stationId: string;
  title: string;
  message: string;
  promotionType: PromotionType;
  fuelTypes: string[];
  targetRadius: number;
  scheduledFor: string | null;
  expiresAt: string | null;
}

export interface StationUpdateFormData {
  name: string;
  address?: string;
  phone: string;
  website: string;
  operatingHours: Record<DayOfWeek, OperatingHours>;
  amenities: string[];
}

export interface BroadcastFilters {
  status: BroadcastStatus | 'all';
  stationId: string | 'all';
  promotionType: PromotionType | 'all';
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export interface StationOwnerDashboardData {
  stationOwner: StationOwner;
  claimedStations: ClaimedStation[];
  broadcasts: Broadcast[];
  dashboardStats: DashboardStats;
  fuelTypes: FuelType[];
  availableStationsForClaim: AvailableStation[];
  currentFuelPrices: Record<string, FuelPrice[]>;
}
