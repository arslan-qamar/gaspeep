// User Authentication & Tiers Types

export type UserTier = 'free' | 'premium';

export type BillingCycle = 'monthly' | 'annual';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trial' | 'paused';

export type OAuthProvider = 'google' | 'apple' | 'facebook';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  memberSince: string;
  tier: UserTier;
  subscriptionStatus?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  emailVerified: boolean;
  connectedProviders: OAuthProvider[];
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  selectedTier: UserTier;
  agreedToTerms: boolean;
}

export interface AuthError {
  field?: string;
  message: string;
  code: string;
}

export interface OAuthConfig {
  provider: OAuthProvider;
  enabled: boolean;
  displayName: string;
  icon: string;
}

export interface PasswordRequirement {
  label: string;
  met: boolean;
  description: string;
}

export interface ContributionStats {
  totalSubmissions: number;
  usersHelped: number;
  pointsEarned: number;
  accuracyRating?: number;
  accuracyTrend?: 'up' | 'down' | 'stable';
  contributionStreak: number;
  dailySubmissionsUsed: number;
  dailySubmissionsLimit: number;
}

export interface RecentSubmission {
  id: string;
  stationName: string;
  fuelType: string;
  price: number;
  timestamp: string;
  status: 'published' | 'verifying' | 'rejected';
}

export interface NotificationPreferences {
  priceAlerts: boolean;
  contributionUpdates: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showContributionStats: boolean;
  shareDataForResearch: boolean;
}

export interface AccountSettings {
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface TierFeature {
  name: string;
  description: string;
  free: string | boolean;
  premium: string | boolean;
  highlight?: boolean;
}

export interface PricingOption {
  tier: UserTier;
  billing: BillingCycle;
  price: number;
  currency: string;
  interval: string;
  savings?: string;
  features: string[];
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  rating: number;
  text: string;
  tier: UserTier;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'billing' | 'features' | 'account' | 'support';
}

export interface TierComparison {
  features: TierFeature[];
  pricing: {
    monthly: PricingOption;
    annual: PricingOption;
  };
  testimonials: Testimonial[];
  faq: FAQItem[];
  stats: {
    premiumMembers: number;
    averageRating: number;
    reviewCount: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
}

export interface EmailAvailability {
  available: boolean;
  suggestion?: string;
}

export interface SubscriptionInfo {
  tier: UserTier;
  status: SubscriptionStatus;
  billingCycle?: BillingCycle;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
    last4?: string;
    brand?: string;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: AuthError;
  user?: User;
}

export interface UpgradeFlow {
  currentStep: 'comparison' | 'payment' | 'confirmation';
  selectedBilling: BillingCycle;
  processing: boolean;
  error?: string;
}
