import React, { useState } from 'react';
import { StationOwner, StationOwnerPlan, VerificationStatus } from './types';

interface AccountSettingsScreenProps {
  owner: StationOwner;
  onBack: () => void;
  onSave: (data: AccountSettingsFormData) => Promise<void>;
  isSaving?: boolean;
}

export interface AccountSettingsFormData {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
}

type FormErrors = Partial<Record<keyof AccountSettingsFormData, string>>;

function validateForm(data: AccountSettingsFormData): FormErrors {
  const errors: FormErrors = {};
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const PHONE_REGEX = /^[\d\s+\-()\u0020]+$/;

  const trimmedBusiness = data.businessName.trim();
  if (!trimmedBusiness) {
    errors.businessName = 'Business name is required';
  } else if (trimmedBusiness.length < 2) {
    errors.businessName = 'Business name must be at least 2 characters';
  } else if (trimmedBusiness.length > 255) {
    errors.businessName = 'Business name must be 255 characters or fewer';
  }

  if (data.contactName.trim().length > 255) {
    errors.contactName = 'Contact name must be 255 characters or fewer';
  }

  const trimmedEmail = data.email.trim();
  if (trimmedEmail) {
    if (trimmedEmail.length > 255) {
      errors.email = 'Email must be 255 characters or fewer';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }
  }

  const trimmedPhone = data.phone.trim();
  if (trimmedPhone) {
    if (trimmedPhone.length > 50) {
      errors.phone = 'Phone must be 50 characters or fewer';
    } else if (!PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Phone must contain only digits, spaces, +, -, (, )';
    }
  }

  return errors;
}

const planBadgeColors: Record<StationOwnerPlan, string> = {
  basic: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
  premium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  enterprise: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
};

const planLabel: Record<StationOwnerPlan, string> = {
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

const verificationExplanation: Record<VerificationStatus, string> = {
  verified: 'Your business is verified. You can broadcast offers to Premium users.',
  pending: 'Your verification is under review. Broadcasts are limited until approved.',
  rejected: 'Verification was rejected. Please resubmit with correct documents.',
  not_verified: 'You have not started the verification process.',
};

/**
 * AccountSettingsScreen Component
 * View and edit station owner account information, plan, and verification status.
 */
export const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({
  owner,
  onBack,
  onSave,
  isSaving = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AccountSettingsFormData>({
    businessName: owner.businessName,
    contactName: owner.contactName,
    email: owner.email,
    phone: owner.phone,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleCancel = () => {
    setFormData({
      businessName: owner.businessName,
      contactName: owner.contactName,
      email: owner.email,
      phone: owner.phone,
    });
    setFormErrors({});
    setApiError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setApiError(null);
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string>; error?: string } } };
      const serverErrors = axiosErr?.response?.data?.errors;
      if (serverErrors) {
        setFormErrors(serverErrors as FormErrors);
      } else {
        const serverMsg = axiosErr?.response?.data?.error;
        setApiError(serverMsg ?? 'Failed to save account settings. Please try again.');
      }
      console.error('Failed to save account settings:', err);
    }
  };

  const handleInputChange = (field: keyof AccountSettingsFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>

      {/* Header */}
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Account Settings</h1>

      {/* Business Information Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Business Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            {/* API Error */}
            {apiError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
              </div>
            )}

            {/* Business Name */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Business Name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className={`w-full mt-2 px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                  formErrors.businessName
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                disabled={isSaving}
              />
              {formErrors.businessName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.businessName}</p>
              )}
            </div>

            {/* Contact Name */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className={`w-full mt-2 px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                  formErrors.contactName
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                disabled={isSaving}
              />
              {formErrors.contactName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.contactName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full mt-2 px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                  formErrors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                disabled={isSaving}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full mt-2 px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                  formErrors.phone
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                disabled={isSaving}
              />
              {formErrors.phone && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.phone}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Business Name Display */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Business Name
              </p>
              <p className="text-base text-slate-900 dark:text-white">{owner.businessName}</p>
            </div>

            {/* Contact Name Display */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Contact Name
              </p>
              <p className="text-base text-slate-900 dark:text-white">{owner.contactName}</p>
            </div>

            {/* Email Display */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Email
              </p>
              <p className="text-base text-slate-900 dark:text-white">{owner.email}</p>
            </div>

            {/* Phone Display */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Phone
              </p>
              <p className="text-base text-slate-900 dark:text-white">{owner.phone}</p>
            </div>
          </div>
        )}
      </div>

      {/* Plan & Usage Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Plan & Usage</h2>

        {/* Plan Badge */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Current Plan
          </p>
          <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${planBadgeColors[owner.plan]}`}>
            {planLabel[owner.plan]}
          </span>
        </div>

        {/* Broadcast Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Broadcasts This Week
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {owner.broadcastsThisWeek} of {owner.broadcastLimit}
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min((owner.broadcastsThisWeek / owner.broadcastLimit) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Upgrade CTA */}
        {owner.plan === 'basic' && (
          <button className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            Upgrade to Premium
          </button>
        )}
      </div>

      {/* Account Status Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Verification Status</h2>

        {/* Status Badge */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              owner.verificationStatus === 'verified'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : owner.verificationStatus === 'pending'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                  : owner.verificationStatus === 'rejected'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            {owner.verificationStatus === 'verified' && '✓ Verified'}
            {owner.verificationStatus === 'pending' && '⏳ Pending'}
            {owner.verificationStatus === 'rejected' && '✕ Rejected'}
            {(owner.verificationStatus === 'not_verified' || !['verified', 'pending', 'rejected'].includes(owner.verificationStatus)) && 'Not Verified'}
          </span>
        </div>

        {/* Status Explanation */}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {verificationExplanation[owner.verificationStatus]}
        </p>

        {/* Verified Date */}
        {owner.verifiedAt && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Verified On
            </p>
            <p className="text-sm text-slate-900 dark:text-white">
              {new Date(owner.verifiedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Account Information Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Account Information</h2>

        {/* Account Created */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Account Created
          </p>
          <p className="text-sm text-slate-900 dark:text-white">
            {new Date(owner.accountCreatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Account ID */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Account ID
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono break-all">{owner.id}</p>
        </div>
      </div>
    </div>
  );
};
