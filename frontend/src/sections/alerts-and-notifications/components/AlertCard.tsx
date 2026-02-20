import React, { useMemo, useState } from 'react';
import { MapPin, Bell, BellOff, Edit2, Trash2, Fuel, Smartphone, Mail } from 'lucide-react';
import { Alert } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: Alert;
  onToggle: (alertId: string, isActive: boolean) => void;
  onEdit: (alertId: string) => void;
  onDelete: (alertId: string) => void;
  onClick?: (alertId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onToggle,
  onEdit,
  onDelete,
  onClick,
}) => {
  const isActive = alert.status === 'active';
  const [mapLoadError, setMapLoadError] = useState(false);

  // Format the badge color based on fuel type color
  const badgeStyle = {
    backgroundColor: `${alert.fuelTypeColor}20`,
    color: alert.fuelTypeColor,
    borderColor: alert.fuelTypeColor,
  };

  const mapImageUrl = useMemo(() => {
    const zoom = alert.radius <= 2 ? 13 : alert.radius <= 5 ? 12 : alert.radius <= 10 ? 11 : 10;
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${alert.location.latitude},${alert.location.longitude}&zoom=${zoom}&size=640x220&markers=${alert.location.latitude},${alert.location.longitude},lightblue1`;
  }, [alert.location.latitude, alert.location.longitude, alert.radius]);

  const coverageCircleSizePercent = Math.max(24, Math.min(88, 20 + alert.radius * 3));
  const notificationMethods = [
    {
      key: 'push',
      label: 'Push',
      icon: Smartphone,
      enabled: alert.notifyViaPush,
    },
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      enabled: alert.notifyViaEmail,
    },
  ];

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all
        ${isActive
          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 opacity-75'
        }
        hover:shadow-md cursor-pointer
      `}
      onClick={() => onClick?.(alert.id)}
    >
      {/* Header with fuel type and status toggle */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border"
              style={badgeStyle}
            >
              {alert.fuelTypeName}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isActive ? (
                <span className="flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <BellOff className="w-3 h-3" />
                  Paused
                </span>
              )}
            </span>
          </div>
          {alert.name && (
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {alert.name}
            </h3>
          )}
        </div>

        {/* Toggle switch */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(alert.id, !isActive);
          }}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${isActive ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}
          `}
          aria-label={isActive ? 'Pause alert' : 'Activate alert'}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${isActive ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Price threshold */}
      <div className="mb-3">
        <div className="text-lg font-bold text-slate-900 dark:text-white">
          ≤ ${alert.priceThreshold.toFixed(2)}/{alert.unit}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Price threshold
        </div>
      </div>

      {/* Fuel type + notification methods */}
      <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Fuel type</div>
          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-100">
            <Fuel className="w-4 h-4" />
            <span>{alert.fuelTypeName}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Notifications</div>
          <div className="flex flex-wrap gap-2">
            {notificationMethods.map((method) => {
              const Icon = method.icon;
              return (
                <span
                  key={method.key}
                  className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded text-xs border
                    ${method.enabled
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
                      : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                    }
                  `}
                >
                  <Icon className="w-3 h-3" />
                  <span>{method.enabled ? method.label : `${method.label} off`}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Location and radius */}
      <div className="flex items-start gap-2 mb-3 text-sm text-slate-600 dark:text-slate-300">
        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <div>{alert.location.address}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Within {alert.radius} {alert.radiusUnit}
          </div>
        </div>
      </div>

      {/* Coverage map */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Coverage preview</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {alert.radius} {alert.radiusUnit} radius
          </span>
        </div>
        <div className="relative h-24 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700">
          {!mapLoadError && (
            <img
              src={mapImageUrl}
              alt={`Coverage map for ${alert.location.address}`}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={() => setMapLoadError(true)}
            />
          )}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute rounded-full border-2 border-blue-500/80 bg-blue-500/20"
              style={{
                width: `${coverageCircleSizePercent}%`,
                height: `${coverageCircleSizePercent}%`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-800 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Last triggered */}
      <div className="mb-4 text-sm">
        {alert.lastTriggeredAt ? (
          <div>
            <span className="text-slate-500 dark:text-slate-400">Last triggered: </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {formatDistanceToNow(new Date(alert.lastTriggeredAt), { addSuffix: true })}
            </span>
            <span className="text-slate-400 dark:text-slate-500 ml-2">
              ({alert.triggerCount} times)
            </span>
          </div>
        ) : (
          <div className="text-slate-400 dark:text-slate-500">Never triggered</div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(alert.id);
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(alert.id);
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
};
