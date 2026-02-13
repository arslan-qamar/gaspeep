import React from 'react';
import { MapPin, Bell, BellOff, Edit2, Trash2 } from 'lucide-react';
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

  // Format the badge color based on fuel type color
  const badgeStyle = {
    backgroundColor: `${alert.fuelTypeColor}20`,
    color: alert.fuelTypeColor,
    borderColor: alert.fuelTypeColor,
  };

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
