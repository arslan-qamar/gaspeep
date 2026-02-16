import React, { useState } from 'react';
import { AvailableStation, ClaimStatus, VerificationMethod } from './types';

interface ClaimStationScreenProps {
  availableStations: AvailableStation[];
  onStationClaimed: (stationId: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

type ClaimStep = 'find' | 'verify' | 'confirm';

interface VerificationState {
  method: VerificationMethod | null;
  documents: File[];
  phoneNumber?: string;
  email?: string;
  verificationCode?: string;
}

/**
 * ClaimStationScreen Component
 * Multi-step process for station owners to claim ownership of a fuel station.
 * Step 1: Find and select station
 * Step 2: Verify ownership (documents, phone, or email)
 * Step 3: Confirmation and next steps
 */
export const ClaimStationScreen: React.FC<ClaimStationScreenProps> = ({
  availableStations,
  onStationClaimed,
  onCancel,
  isSubmitting,
}) => {
  const [currentStep, setCurrentStep] = useState<ClaimStep>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<AvailableStation | null>(null);
  const [verificationState, setVerificationState] = useState<VerificationState>({
    method: null,
    documents: [],
  });
  const [verificationRequestId, setVerificationRequestId] = useState('');

  // Filter stations based on search
  const searchResults = searchQuery.trim()
    ? availableStations.filter(
        (station) =>
          station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          station.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          station.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleStationSelect = (station: AvailableStation) => {
    if (station.claimStatus === 'claimed') {
      return; // Can't select already claimed stations
    }
    setSelectedStation(station);
    setCurrentStep('verify');
  };

  const handleDocumentUpload = (files: FileList | null) => {
    if (!files) return;
    const newDocuments = Array.from(files);
    setVerificationState((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newDocuments],
    }));
  };

  const handleRemoveDocument = (index: number) => {
    setVerificationState((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleVerificationSubmit = async () => {
    if (!selectedStation || verificationState.documents.length === 0) {
      return;
    }

    // Simulate verification submission
    if (isSubmitting) return;

    // Generate a mock request ID
    const requestId = `VR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setVerificationRequestId(requestId);
    setCurrentStep('confirm');
  };

  const handleReturnToDashboard = () => {
    if (selectedStation) {
      onStationClaimed(selectedStation.id);
    }
  };

  const steps = [
    { number: 1, label: 'Find Station' },
    { number: 2, label: 'Verify' },
    { number: 3, label: 'Confirm' },
  ];

  const currentStepNumber =
    currentStep === 'find' ? 1 : currentStep === 'verify' ? 2 : 3;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Claim Station
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Step {currentStepNumber} of 3: {steps[currentStepNumber - 1].label}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-2">
        {steps.map((step, idx) => (
          <div
            key={step.number}
            className={`flex-1 h-2 rounded-full transition-colors ${
              step.number <= currentStepNumber
                ? 'bg-blue-600 dark:bg-blue-500'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
            aria-label={`Step ${step.number}: ${step.label}`}
          />
        ))}
      </div>

      {/* Step 1: Find Station */}
      {currentStep === 'find' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Find Your Station
          </h2>

          {/* Search Input */}
          <div>
            <input
              type="text"
              placeholder="Search by name or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Use Current Location Button */}
          <button
            onClick={() => {}} // Will be connected to geolocation API
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            📍 Use Current Location
          </button>

          {/* Map View Toggle */}
          <button
            onClick={() => {}} // Will be connected to map view
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            🗺️ Map View
          </button>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-slate-600 dark:text-slate-400">
                  <p className="mb-3">Station not found?</p>
                  <button className="text-blue-600 dark:text-blue-400 hover:underline">
                    Submit a request to add it
                  </button>
                </div>
              ) : (
                searchResults.map((station) => (
                  <StationSearchResult
                    key={station.id}
                    station={station}
                    onSelect={handleStationSelect}
                  />
                ))
              )}
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Step 2: Verify Ownership */}
      {currentStep === 'verify' && selectedStation && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Verify Ownership
          </h2>

          {/* Selected Station Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {selectedStation.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {selectedStation.address}
            </p>
          </div>

          {/* Verification Instructions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Upload Business Documentation
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please upload one of the following:
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Business license</li>
              <li>Lease agreement</li>
              <li>Proof of ownership</li>
            </ul>
          </div>

          {/* Document Upload Area */}
          <div
            data-testid="document-upload-area"
            className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDocumentUpload(e.dataTransfer.files);
            }}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleDocumentUpload(e.target.files)}
              className="hidden"
              id="document-input"
              data-testid="document-file-input"
            />
            <label
              htmlFor="document-input"
              className="cursor-pointer block"
            >
              <p className="text-slate-900 dark:text-white font-medium">
                Drag files here or click to browse
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                PDF, JPG, PNG (Max 10MB each)
              </p>
            </label>
          </div>

          {/* Uploaded Documents */}
          {verificationState.documents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Uploaded documents ({verificationState.documents.length})
              </p>
              {verificationState.documents.map((doc, idx) => (
                <div
                  key={idx}
                  data-testid="uploaded-document"
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {doc.name}
                  </span>
                  <button
                    onClick={() => handleRemoveDocument(idx)}
                    className="text-red-600 dark:text-red-400 hover:underline text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleVerificationSubmit}
            disabled={verificationState.documents.length === 0 || isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
          </button>

          {/* Back Button */}
          <button
            onClick={() => {
              setCurrentStep('find');
              setSelectedStation(null);
            }}
            className="w-full px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 'confirm' && selectedStation && (
        <div className="space-y-4 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Verification Request Submitted
          </h2>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg space-y-3 text-left">
            <p className="text-slate-700 dark:text-slate-300">
              We'll review your documentation within <strong>2-3 business days</strong>.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You'll receive an email notification once your station is verified.
            </p>
            {verificationRequestId && (
              <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Request ID:
                </p>
                <p
                  data-testid="verification-request-id"
                  className="text-sm font-mono text-slate-900 dark:text-white break-all"
                >
                  {verificationRequestId}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-left space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              What happens next?
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>We'll verify your documents</li>
              <li>You'll get an email when approved</li>
              <li>Start creating broadcasts immediately</li>
              <li>Contact support if you have questions</li>
            </ul>
          </div>

          {/* Return Button */}
          <button
            onClick={handleReturnToDashboard}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

interface StationSearchResultProps {
  station: AvailableStation;
  onSelect: (station: AvailableStation) => void;
}

/**
 * StationSearchResult - Individual search result card
 */
const StationSearchResult: React.FC<StationSearchResultProps> = ({ station, onSelect }) => {
  const isClaimed = station.claimStatus === 'claimed';
  const isPending = station.claimStatus === 'pending';

  return (
    <div
      data-testid="station-search-result"
      className={`p-4 border rounded-lg transition-colors ${
        isClaimed
          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {station.name}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {station.address}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-slate-500 dark:text-slate-500">
              {station.brand}
            </span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="text-slate-500 dark:text-slate-500">
              {station.distance.toFixed(1)} km away
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
              isClaimed
                ? 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                : isPending
                  ? 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                  : 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200'
            }`}
          >
            {isClaimed ? '❌ Claimed' : isPending ? '⏳ Pending' : '✅ Available'}
          </span>

          {isClaimed ? (
            <div className="text-right">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                This station is already claimed
              </p>
              <button className="text-xs text-red-600 dark:text-red-400 hover:underline">
                Dispute claim
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelect(station)}
              disabled={isClaimed}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
            >
              Select This Station
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
