import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Bell, BellOff, Edit2, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Alert, AlertStatistics, AlertTrigger, MatchingStation } from '../types';
import {
  deleteAlert,
  fetchAlertById,
  fetchAlertStatistics,
  fetchAlertTriggers,
  fetchMatchingStations,
  updateAlert,
} from '../api/alertsApi';
import { ConfirmDialog } from '../../../shell/components/ConfirmDialog';

export const AlertDetailsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { alertId } = useParams<{ alertId: string }>();
  const [alertData, setAlertData] = useState<Alert | null>(null);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [triggers, setTriggers] = useState<AlertTrigger[]>([]);
  const [matchingStations, setMatchingStations] = useState<MatchingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!alertId) {
      setError('Invalid alert id');
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseAlert = await fetchAlertById(alertId);
        if (!mounted) return;
        setAlertData(baseAlert);

        const [statsResult, triggersResult, stationsResult] = await Promise.allSettled([
          fetchAlertStatistics(alertId),
          fetchAlertTriggers(alertId),
          fetchMatchingStations(alertId),
        ]);

        if (!mounted) return;

        if (statsResult.status === 'fulfilled') {
          setStatistics(statsResult.value);
        }

        if (triggersResult.status === 'fulfilled') {
          const sorted = [...triggersResult.value].sort(
            (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
          );
          setTriggers(sorted);
        }

        if (stationsResult.status === 'fulfilled') {
          const sorted = [...stationsResult.value].sort((a, b) => a.distance - b.distance);
          setMatchingStations(sorted);
        }
      } catch (err) {
        console.error('Error loading alert details:', err);
        if (mounted) {
          setError('Failed to load alert details. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [alertId]);

  const radiusKm = useMemo(() => {
    if (!alertData) return 0;
    return alertData.radiusUnit === 'miles' ? alertData.radius * 1.60934 : alertData.radius;
  }, [alertData]);

  const mapZoom = useMemo(() => {
    if (radiusKm <= 2) return 13;
    if (radiusKm <= 5) return 12;
    if (radiusKm <= 20) return 11;
    if (radiusKm <= 50) return 10;
    return 9;
  }, [radiusKm]);

  const coverageCircleSizePercent = useMemo(() => {
    const normalized = Math.max(0, Math.min(radiusKm, 50)) / 50;
    return Math.round(26 + 120 * Math.sqrt(normalized));
  }, [radiusKm]);

  const handleToggleStatus = async () => {
    if (!alertData || isUpdating) return;
    try {
      setIsUpdating(true);
      const nextStatus = alertData.status === 'active' ? 'paused' : 'active';
      const updated = await updateAlert(alertData.id, { status: nextStatus });
      setAlertData(updated);
    } catch (err) {
      console.error('Error updating alert status:', err);
      window.alert('Failed to update alert status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!alertData || isDeleting) return;
    setShowDeleteConfirm(false);
    try {
      setIsDeleting(true);
      await deleteAlert(alertData.id);
      navigate('/alerts');
    } catch (err) {
      console.error('Error deleting alert:', err);
      window.alert('Failed to delete alert. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !alertData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/alerts')}
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to alerts
          </button>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-600 dark:text-red-300">{error ?? 'Alert not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/alerts')}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to alerts
        </button>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {alertData.name || `${alertData.fuelTypeName} Alert`}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Created {formatDistanceToNow(new Date(alertData.createdAt), { addSuffix: true })}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${
                alertData.status === 'active'
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
              }`}
            >
              {alertData.status === 'active' ? 'Active' : 'Paused'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded bg-slate-50 dark:bg-slate-900">
              <div className="text-xs text-slate-500 dark:text-slate-400">Threshold</div>
              <div className="font-semibold text-slate-900 dark:text-white">
                ≤ ${alertData.priceThreshold.toFixed(2)}/{alertData.unit}
              </div>
            </div>
            <div className="p-3 rounded bg-slate-50 dark:bg-slate-900">
              <div className="text-xs text-slate-500 dark:text-slate-400">Fuel Type</div>
              <div className="font-semibold text-slate-900 dark:text-white">{alertData.fuelTypeName}</div>
            </div>
            <div className="p-3 rounded bg-slate-50 dark:bg-slate-900">
              <div className="text-xs text-slate-500 dark:text-slate-400">Radius</div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {alertData.radius} {alertData.radiusUnit}
              </div>
            </div>
            <div className="p-3 rounded bg-slate-50 dark:bg-slate-900">
              <div className="text-xs text-slate-500 dark:text-slate-400">Triggered</div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {statistics?.triggerCount ?? alertData.triggerCount}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            {alertData.location.address}
          </div>

          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">Coverage preview</div>

          <div className="mt-2 relative h-48 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700">
            <Map
              initialViewState={{
                latitude: alertData.location.latitude,
                longitude: alertData.location.longitude,
                zoom: mapZoom,
              }}
              mapStyle="https://tiles.openfreemap.org/styles/liberty"
              style={{ width: '100%', height: '100%' }}
              interactive={false}
            >
              <Marker longitude={alertData.location.longitude} latitude={alertData.location.latitude}>
                <div className="w-3 h-3 rounded-full bg-blue-600 border border-white" />
              </Marker>
            </Map>
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute rounded-full border-2 border-blue-500/80 bg-blue-500/20"
                style={{
                  width: `${coverageCircleSizePercent}%`,
                  aspectRatio: '1 / 1',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleToggleStatus}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            >
              {alertData.status === 'active' ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {isUpdating ? 'Updating...' : alertData.status === 'active' ? 'Pause Alert' : 'Activate Alert'}
            </button>
            <button
              onClick={() => navigate(`/alerts/edit/${alertData.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Matching Stations ({matchingStations.length})
            </h2>
            {matchingStations.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No matching stations right now.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {matchingStations.slice(0, 10).map((station) => (
                  <div
                    key={station.stationId}
                    className="p-2 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {station.stationName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ${station.price.toFixed(2)}/{station.unit} • {station.distance.toFixed(1)} km away
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Trigger History ({triggers.length})
            </h2>
            {triggers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No triggers recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {triggers.slice(0, 10).map((trigger) => (
                  <div
                    key={trigger.id}
                    className="p-2 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {trigger.stationName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ${trigger.price.toFixed(2)}/{trigger.unit} •{' '}
                      {formatDistanceToNow(new Date(trigger.triggeredAt), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Alert?"
        message="Are you sure you want to delete this alert? This action cannot be undone."
        confirmLabel="Delete Alert"
        isConfirming={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setShowDeleteConfirm(false);
          }
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};
