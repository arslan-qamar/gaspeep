import React from 'react';
import { Bell, MapPin, Store, Info, Navigation, Eye, X } from 'lucide-react';
import { Notification, AlertNotificationData, BroadcastNotificationData, SystemNotificationData } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  onAction: (notification: Notification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onAction,
}) => {
  const isUnread = !notification.readAt;

  // Handle click - mark as read and trigger action
  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    onAction(notification);
  };

  // Render notification icon based on type
  const renderIcon = () => {
    switch (notification.type) {
      case 'alert':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'broadcast':
        return <Store className="w-5 h-5 text-orange-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  // Render notification-specific content
  const renderContent = () => {
    if (notification.type === 'alert') {
      const data = notification.data as AlertNotificationData;
      return (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
              style={{
                backgroundColor: `${data.fuelTypeColor}20`,
                color: data.fuelTypeColor,
                borderColor: data.fuelTypeColor,
              }}
            >
              {data.fuelTypeName}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {data.distance.toFixed(1)} km away
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">
            {data.stationName}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {data.stationAddress}
          </div>
        </div>
      );
    }

    if (notification.type === 'broadcast') {
      const data = notification.data as BroadcastNotificationData;
      return (
        <div>
          <div className="flex items-center gap-2 mb-1">
            {data.stationLogo && (
              <img src={data.stationLogo} alt="" className="w-6 h-6 rounded" />
            )}
            <span className="font-medium text-sm text-slate-900 dark:text-white">
              {data.stationName}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {data.distance.toFixed(1)} km away
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">
            {data.promotionalMessage}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Valid until {new Date(data.validUntil).toLocaleDateString()}
          </div>
        </div>
      );
    }

    if (notification.type === 'system') {
      const data = notification.data as SystemNotificationData;
      return (
        <div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {notification.message}
          </div>
          {data.actionLabel && (
            <div className="mt-2">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {data.actionLabel} →
              </span>
            </div>
          )}
        </div>
      );
    }
  };

  // Render action buttons based on notification type
  const renderActions = () => {
    if (notification.type === 'alert') {
      return (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction(notification);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            <MapPin className="w-3 h-3" />
            View on Map
          </button>
        </>
      );
    }

    if (notification.type === 'broadcast') {
      const data = notification.data as BroadcastNotificationData;
      return (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction(notification);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            <Eye className="w-3 h-3" />
            View Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Open directions in default maps app
              const url = `https://www.google.com/maps/dir/?api=1&destination=${data.stationLatitude},${data.stationLongitude}`;
              window.open(url, '_blank');
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
          >
            <Navigation className="w-3 h-3" />
            Directions
          </button>
        </>
      );
    }

    return null;
  };

  return (
    <div
      className={`
        relative p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer
        transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50
        ${isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
      `}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-r" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">{renderIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                {notification.title}
              </h4>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="flex-shrink-0 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
              aria-label="Delete notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {renderContent()}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {renderActions()}
          </div>
        </div>
      </div>
    </div>
  );
};
