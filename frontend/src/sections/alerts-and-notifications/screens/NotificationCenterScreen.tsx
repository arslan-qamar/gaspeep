import React, { useState, useEffect } from 'react';
import { Bell, Settings, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationItem } from '../components/NotificationItem';
import { Notification, NotificationType } from '../types';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../api/alertsApi';

type FilterTab = 'all' | 'alert' | 'broadcast' | 'system';

export const NotificationCenterScreen: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const type = activeTab === 'all' ? undefined : (activeTab as NotificationType);
      const data = await fetchNotifications(type);
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, readAt: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, readAt: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
      alert('Failed to mark all as read. Please try again.');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Failed to delete notification. Please try again.');
    }
  };

  const handleAction = (notification: Notification) => {
    // Handle different notification actions
    if (notification.type === 'alert') {
      // Navigate to map view with station highlighted
      const data = notification.data as any;
      navigate(`/map?station=${data.stationId}`);
    } else if (notification.type === 'broadcast') {
      // View broadcast details (could open a modal or navigate)
      const data = notification.data as any;
      navigate(`/map?station=${data.stationId}`);
    } else if (notification.type === 'system') {
      // Handle system notification action
      const data = notification.data as any;
      if (data.actionUrl) {
        navigate(data.actionUrl);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // Filter notifications by tab
  const filteredNotifications = notifications;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
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
              onClick={loadNotifications}
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
  if (notifications.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Notifications
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Stay updated with price alerts and offers
              </p>
            </div>
            <button
              onClick={() => navigate('/notifications/settings')}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Notification settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(['all', 'alert', 'broadcast', 'system'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Empty state */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No notifications yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              You'll see price alerts and station offers here when you receive them
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main content with notifications
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={() => navigate('/notifications/settings')}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notification settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'alert', 'broadcast', 'system'] as FilterTab[]).map((tab) => {
              const count =
                tab === 'all'
                  ? notifications.length
                  : notifications.filter((n) => n.type === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-2 text-xs opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications list */}
        <div className="bg-white dark:bg-slate-800">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No {activeTab !== 'all' && activeTab} notifications found
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onAction={handleAction}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
