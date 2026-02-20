import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader } from 'lucide-react';
import { StepIndicator } from '../components/StepIndicator';
import { LocationPicker } from '../components/LocationPicker';
import { CreateAlertForm, FuelType, PriceContext } from '../types';
import {
  createAlert,
  fetchAlertById,
  updateAlert,
  fetchFuelTypes,
  fetchPriceContext,
  CreateAlertPayload,
} from '../api/alertsApi';

const STEPS = [
  { number: 1, title: 'Fuel Type' },
  { number: 2, title: 'Location' },
  { number: 3, title: 'Threshold' },
];

export const CreateAlertScreen: React.FC = () => {
  const navigate = useNavigate();
  const { alertId } = useParams<{ alertId: string }>();
  const isEditMode = !!alertId;

  const [formData, setFormData] = useState<CreateAlertForm>({
    step: 1,
    fuelTypeId: null,
    location: null,
    radius: 5,
    radiusUnit: 'km',
    priceThreshold: null,
    alertName: '',
    notifyViaPush: true,
    notifyViaEmail: false,
    recurrenceType: 'recurring',
  });

  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [priceContext, setPriceContext] = useState<PriceContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [contextRadiusKm, setContextRadiusKm] = useState(5);
  const priceContextTimeoutRef = useRef<number | null>(null);
  const latestPriceContextRequestRef = useRef(0);

  // Load fuel types on mount
  useEffect(() => {
    loadFuelTypes();
  }, []);

  // Load existing alert data if in edit mode
  useEffect(() => {
    if (isEditMode && alertId) {
      loadAlertData(alertId);
    }
  }, [isEditMode, alertId]);

  // Load price context when location/radius/fuel type changes
  useEffect(() => {
    if (!formData.location || !formData.fuelTypeId || formData.step < 2) return;

    if (priceContextTimeoutRef.current) {
      window.clearTimeout(priceContextTimeoutRef.current);
    }

    priceContextTimeoutRef.current = window.setTimeout(() => {
      void loadPriceContext(
        formData.fuelTypeId!,
        formData.location!.latitude,
        formData.location!.longitude,
        contextRadiusKm
      );
    }, 350);

    return () => {
      if (priceContextTimeoutRef.current) {
        window.clearTimeout(priceContextTimeoutRef.current);
      }
    };
  }, [formData.location, formData.fuelTypeId, formData.step, contextRadiusKm]);

  useEffect(() => {
    if (!isEditMode) return;
    setContextRadiusKm(formData.radius);
  }, [formData.radius, isEditMode]);

  const loadFuelTypes = async () => {
    try {
      const types = await fetchFuelTypes();
      setFuelTypes(types.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      console.error('Error loading fuel types:', err);
    }
  };

  const loadAlertData = async (id: string) => {
    try {
      setLoading(true);
      const alert = await fetchAlertById(id);
      setFormData({
        step: 1,
        fuelTypeId: alert.fuelTypeId,
        location: alert.location,
        radius: alert.radius,
        radiusUnit: alert.radiusUnit,
        priceThreshold: alert.priceThreshold,
        alertName: alert.name,
        notifyViaPush: alert.notifyViaPush,
        notifyViaEmail: alert.notifyViaEmail,
        recurrenceType: alert.recurrenceType ?? 'recurring',
      });
    } catch (err) {
      console.error('Error loading alert:', err);
      alert('Failed to load alert data');
      navigate('/alerts');
    } finally {
      setLoading(false);
    }
  };

  const loadPriceContext = async (
    fuelTypeId: string,
    latitude: number,
    longitude: number,
    radius: number
  ) => {
    const requestId = ++latestPriceContextRequestRef.current;
    try {
      setLoadingContext(true);
      const context = await fetchPriceContext(
        fuelTypeId,
        latitude,
        longitude,
        radius
      );
      if (requestId === latestPriceContextRequestRef.current) {
        setPriceContext(context);
      }
    } catch (err) {
      console.error('Error loading price context:', err);
    } finally {
      if (requestId === latestPriceContextRequestRef.current) {
        setLoadingContext(false);
      }
    }
  };

  const handleNext = () => {
    if (formData.step < 3) {
      if (formData.step === 2) {
        setContextRadiusKm(formData.radius);
      }
      setFormData({ ...formData, step: (formData.step + 1) as 1 | 2 | 3 });
    }
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, radius: parseInt(e.target.value, 10) });
  };

  const commitRadiusForContext = () => {
    setContextRadiusKm(formData.radius);
  };

  const handleBack = () => {
    if (formData.step > 1) {
      setFormData({ ...formData, step: (formData.step - 1) as 1 | 2 | 3 });
    } else {
      navigate('/alerts');
    }
  };

  const handleSubmit = async () => {
    if (!formData.fuelTypeId || !formData.location || formData.priceThreshold === null) {
      alert('Please complete all required fields');
      return;
    }

    const payload: CreateAlertPayload = {
      name: formData.alertName,
      fuelTypeId: formData.fuelTypeId,
      priceThreshold: formData.priceThreshold,
      recurrenceType: formData.recurrenceType,
      location: formData.location,
      radius: formData.radius,
      radiusUnit: formData.radiusUnit,
      notifyViaPush: formData.notifyViaPush,
      notifyViaEmail: formData.notifyViaEmail,
    };

    try {
      setSubmitting(true);
      if (isEditMode && alertId) {
        await updateAlert(alertId, payload);
      } else {
        await createAlert(payload);
      }
      navigate('/alerts');
    } catch (err) {
      console.error('Error saving alert:', err);
      alert('Failed to save alert. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  // Check if current step is valid before allowing next
  const canProceedToNextStep = () => {
    if (formData.step === 1) return formData.fuelTypeId !== null;
    if (formData.step === 2) return formData.location !== null;
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditMode ? 'Edit Alert' : 'Create Price Alert'}
          </h1>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={formData.step} steps={STEPS} />

        {/* Step Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
          {/* Step 1: Fuel Type Selection */}
          {formData.step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Select Fuel Type
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Choose the fuel type you want to monitor for price drops
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fuelTypes.map((fuelType) => (
                  <button
                    key={fuelType.id}
                    onClick={() => setFormData({ ...formData, fuelTypeId: fuelType.id })}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${
                        formData.fuelTypeId === fuelType.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <div
                      className="w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: fuelType.color }}
                    />
                    <div className="font-medium text-slate-900 dark:text-white">
                      {fuelType.displayName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Location & Radius */}
          {formData.step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Set Location & Radius
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Define where you want to monitor fuel prices
              </p>

              {/* Location input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Location
                </label>
                <LocationPicker
                  value={formData.location}
                  radiusKm={formData.radius}
                  infoContent={
                    loadingContext ? (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Loading station data...
                      </div>
                    ) : priceContext ? (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          <strong>{priceContext.stationCount}</strong> stations found within {formData.radius} km
                        </div>
                      </div>
                    ) : null
                  }
                  onChange={(location) => setFormData({ ...formData, location })}
                />
              </div>

              {/* Radius slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Monitoring Radius: {formData.radius} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={formData.radius}
                  onChange={handleRadiusChange}
                  onMouseUp={commitRadiusForContext}
                  onTouchEnd={commitRadiusForContext}
                  onKeyUp={commitRadiusForContext}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>1 km</span>
                  <span>50 km</span>
                </div>
              </div>

            </div>
          )}

          {/* Step 3: Price Threshold */}
          {formData.step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Set Price Threshold
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                You'll be notified when prices drop to or below this amount
              </p>

              {/* Price context */}
              {priceContext && (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Current Average</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        ${priceContext.averagePrice.toFixed(2)}/{priceContext.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Lowest Price</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${priceContext.lowestPrice.toFixed(2)}/{priceContext.unit}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    at {priceContext.lowestPriceStationName}
                  </div>
                </div>
              )}

              {/* Price threshold input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Price Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceThreshold ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, priceThreshold: parseFloat(e.target.value) })
                    }
                    placeholder="1.85"
                    className="w-full pl-8 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    /L
                  </span>
                </div>
              </div>

              {/* Alert recurrence */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alert Frequency
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, recurrenceType: 'one_off' })
                    }
                    className={`
                      rounded-lg border-2 px-4 py-3 text-left transition-colors
                      ${
                        formData.recurrenceType === 'one_off'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="font-medium text-slate-900 dark:text-white">One-off</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Notify once, then stop this alert
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, recurrenceType: 'recurring' })
                    }
                    className={`
                      rounded-lg border-2 px-4 py-3 text-left transition-colors
                      ${
                        formData.recurrenceType === 'recurring'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="font-medium text-slate-900 dark:text-white">Recurring</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Keep notifying whenever prices match
                    </div>
                  </button>
                </div>
              </div>

              {/* Alert name (optional) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alert Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.alertName}
                  onChange={(e) => setFormData({ ...formData, alertName: e.target.value })}
                  placeholder="e.g., Work commute diesel"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Notification preferences */}
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.notifyViaPush}
                    onChange={(e) =>
                      setFormData({ ...formData, notifyViaPush: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 border-slate-300 dark:border-slate-700 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Push notifications
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.notifyViaEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, notifyViaEmail: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 border-slate-300 dark:border-slate-700 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Email notifications
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleBack}
              className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {formData.step === 1 ? 'Cancel' : 'Back'}
            </button>

            {formData.step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg transition-colors
                  ${
                    canProceedToNextStep()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || formData.priceThreshold === null}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg transition-colors
                  ${
                    !submitting && formData.priceThreshold !== null
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {isEditMode ? 'Update Alert' : 'Create Alert'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
