import React, { useState, useEffect } from 'react';
import { Plus, Bell, Crown, Filter as FilterIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlertCard } from '../components/AlertCard';
import { Alert } from '../types';
import {
  fetchUserAlerts,
  updateAlert,
  deleteAlert,
} from '../api/alertsApi';
import { useAuth } from '../../../hooks/useAuth';

type FilterType = 'all' | 'active' | 'paused';

export const AlertsListScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');

  const isPremium = user?.tier === 'premium';

  // Fetch alerts on component mount
  useEffect(() => {
    if (isPremium) {
      loadAlerts();
    } else {
      setLoading(false);
    }
  }, [isPremium]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUserAlerts();
      setAlerts(data || []);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    const currentAlert = alerts.find((alert) => alert.id === alertId);
    if (!currentAlert) {
      return;
    }

    try {
      const updatedAlert = await updateAlert(alertId, {
        status: isActive ? 'active' : 'paused',
        priceThreshold: currentAlert.priceThreshold,
        radius: currentAlert.radius,
        radiusUnit: currentAlert.radiusUnit,
        name: currentAlert.name,
        notifyViaPush: currentAlert.notifyViaPush,
        notifyViaEmail: currentAlert.notifyViaEmail,
      });
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === alertId ? updatedAlert : alert))
      );
    } catch (err) {
      console.error('Error toggling alert:', err);
      alert('Failed to update alert status. Please try again.');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this alert? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await deleteAlert(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (err) {
      console.error('Error deleting alert:', err);
      alert('Failed to delete alert. Please try again.');
    }
  };

  const handleEditAlert = (alertId: string) => {
    navigate(`/alerts/edit/${alertId}`);
  };

  const handleAlertClick = (alertId: string) => {
    navigate(`/alerts/${alertId}`);
  };

  // Filter alerts based on selected filter
  const filteredAlerts = alerts.filter((alert) => {
    if (filterType === 'all') return true;
    if (filterType === 'active') return alert.status === 'active';
    if (filterType === 'paused') return alert.status === 'paused';
    return true;
  });

  // Render premium upgrade prompt for free users
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Price Alerts
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Get notified when fuel prices drop
            </p>
          </div>

          {/* Premium Upgrade Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8" />
              <h2 className="text-xl font-bold">Unlock Custom Alerts with Premium</h2>
            </div>

            <p className="mb-6 opacity-90">
              Set custom price threshold alerts for your favorite fuel types and locations.
              Get real-time notifications when prices drop below your target.
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <span>Unlimited custom price alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <span>Real-time push notifications</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <span>Location-based radius alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <span>Station owner promotional broadcasts</span>
              </li>
            </ul>

            <button
              onClick={() => navigate('/profile?tab=subscription')}
              className="w-full bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadAlerts}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (alerts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Price Alerts
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Get notified when fuel prices drop
              </p>
            </div>
          </div>

          {/* Empty state */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No alerts yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Create your first price alert to get notified when fuel prices drop below
              your threshold
            </p>
            <button
              onClick={() => navigate('/alerts/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Alert
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content with alerts
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Price Alerts
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} configured
            </p>
          </div>
          <button
            onClick={() => navigate('/alerts/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create Alert</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          <FilterIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {(['all', 'active', 'paused'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                ${
                  filterType === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              <span className="ml-2 text-xs opacity-75">
                ({filter === 'all' ? alerts.length : alerts.filter((a) => filter === 'active' ? a.status === 'active' : a.status === 'paused').length})
              </span>
            </button>
          ))}
        </div>

        {/* Alerts list */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No {filterType} alerts found
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={handleToggleAlert}
                onEdit={handleEditAlert}
                onDelete={handleDeleteAlert}
                onClick={handleAlertClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
