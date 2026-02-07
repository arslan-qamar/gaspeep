/**
 * Type definitions for Price Submission System
 */

export type FuelType = 'E10' | 'Unleaded 91' | 'Diesel' | 'Premium Diesel' | 'U95' | 'U98' | 'LPG' | 'Truck Diesel' | 'AdBlue' | 'E85' | 'Biodiesel';

export type SubmissionMethod = 'manual' | 'voice' | 'photo';

export type SubmissionStatus = 'draft' | 'pending' | 'published' | 'verifying' | 'rejected';

export type UserTier = 'free' | 'premium';

export interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  distance?: number; // miles from user
}

export interface PriceSubmission {
  id: string;
  stationId: string;
  station: Station;
  fuelType: FuelType;
  price: number; // dollars per gallon
  timestamp: string; // ISO 8601
  method: SubmissionMethod;
  status: SubmissionStatus;
  notes?: string;
  userId: string;
  confidence?: number; // 0-1 for OCR/voice submissions
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface VoiceTranscription {
  rawText: string;
  parsedData: {
    stationName?: string;
    fuelType?: FuelType;
    price?: number;
    confidence: number;
  };
  isProcessing: boolean;
  error?: string;
}

export interface PhotoSubmission {
  imageUrl: string;
  stationId: string;
  detectedPrices: DetectedPrice[];
  isProcessing: boolean;
  ocrConfidence: number;
  error?: string;
}

export interface DetectedPrice {
  fuelType: FuelType;
  price: number;
  confidence: number; // 0-1
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SubmissionFormData {
  station: Station | null;
  fuelType: FuelType | null;
  price: string;
  timestamp: string;
  notes: string;
}

export interface ContributionStats {
  totalSubmissions: number;
  monthlySubmissions: number;
  weeklySubmissions: number;
  todaySubmissions: number;
  pointsEarned: number;
  verificationRate: number; // percentage
  trustScore: number; // 0-100
  usersHelped: number;
  rank?: string; // "Top Contributor", etc.
}

export interface RecentSubmission {
  id: string;
  station: Station;
  fuelType: FuelType;
  price: number;
  timestamp: string;
  status: SubmissionStatus;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface NearbyStation {
  station: Station;
  lastUpdated?: string;
  priceCount?: number;
}

export interface SubmissionLimits {
  dailyLimit: number;
  remaining: number;
  nextReset: string; // ISO 8601
  upgradePrompt?: string;
}
