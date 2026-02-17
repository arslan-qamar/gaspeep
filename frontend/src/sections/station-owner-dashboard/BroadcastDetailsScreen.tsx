import React, { useState } from 'react';
import { Broadcast } from './types';

interface BroadcastDetailsScreenProps {
  broadcast: Broadcast;
  onEdit: (broadcastId: string) => void;
  onDuplicate: (broadcastId: string) => void;
  onDelete: (broadcastId: string) => void;
  onCancel: (broadcastId: string) => void;
  isLoading?: boolean;
}

/**
 * BroadcastDetailsScreen Component
 * Displays detailed information about a broadcast including engagement metrics,
 * targeting details, and management actions.
 */
export const BroadcastDetailsScreen: React.FC<BroadcastDetailsScreenProps> = ({
  broadcast,
  onEdit,
  onDuplicate,
  onDelete,
  onCancel,
  isLoading,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    scheduled: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    expired: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
    draft: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  };

  const statusEmoji: Record<string, string> = {
    active: '🟢',
    scheduled: '⏰',
    expired: '⏸️',
    draft: '📝',
  };

  const promotionTypeLabels: Record<string, string> = {
    price_drop: 'Price Drop',
    special_discount: 'Special Discount',
    limited_time_offer: 'Limited Time Offer',
    new_service: 'New Service',
    general_announcement: 'General Announcement',
  };

  const canEdit = broadcast.status === 'draft' || broadcast.status === 'scheduled' || broadcast.status === 'active';
  const canCancel = broadcast.status === 'scheduled';
  const canDuplicate = broadcast.status === 'expired' || broadcast.status === 'draft';
  const isScheduled = broadcast.status === 'scheduled';

  const engagementRate =
    broadcast.delivered > 0
      ? Math.round((broadcast.opened / broadcast.delivered) * 100)
      : 0;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              data-testid="skeleton"
              className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white truncate">
            {broadcast.title}
          </h1>
          <span
            data-testid="status-badge"
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              statusColor[broadcast.status]
            }`}
          >
            {statusEmoji[broadcast.status]} {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Broadcast Details Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Station
            </p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {broadcast.stationName}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Promotion Type
            </p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {promotionTypeLabels[broadcast.promotionType]}
            </p>
            <span className="hidden">{broadcast.promotionType}</span>
          </div>

          <div data-testid="creation-date">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Created
            </p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {new Date(broadcast.createdAt).toISOString().split('T')[0]}
            </p>
          </div>

          {broadcast.sentAt && (
            <div data-testid="sent-date">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Sent
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {new Date(broadcast.sentAt).toLocaleString()}
              </p>
            </div>
          )}

          {isScheduled && broadcast.scheduledFor && (
            <div className="col-span-1 md:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Scheduled for
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {new Date(broadcast.scheduledFor).toLocaleString()}
              </p>
            </div>
          )}

          {broadcast.expiresAt && (
            <div className="col-span-1 md:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Expires
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {new Date(broadcast.expiresAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Message
          </p>
          <p className="text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">
            {broadcast.message}
          </p>
        </div>

        {/* Fuel Types */}
        {broadcast.fuelTypes.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Fuel Types
            </p>
            <div className="flex flex-wrap gap-2">
              {broadcast.fuelTypes.map((fuelType) => (
                <span
                  key={fuelType}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm"
                >
                  {fuelType}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Targeting Summary */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Targeting Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Radius
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {broadcast.targetRadius} {broadcast.radiusUnit}
            </p>
          </div>

          {broadcast.estimatedRecipients !== broadcast.actualRecipients && (
            <div data-testid="target-recipients">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Targeted
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {broadcast.estimatedRecipients}
              </p>
            </div>
          )}

          <div data-testid="actual-recipients">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Recipients
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {broadcast.actualRecipients}
            </p>
          </div>
        </div>

        {/* Coverage Map */}
        <div
          data-testid="coverage-map"
          className="w-full h-48 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center"
        >
          <span className="text-slate-500 dark:text-slate-400">
            Coverage map visualization
          </span>
        </div>
      </div>

      {/* Engagement Metrics */}
      {(broadcast.status === 'active' || broadcast.status === 'expired') && (
        <div
          data-testid="engagement-metrics"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Engagement Summary
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg" data-testid="delivered-metric">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Delivered
              </p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {broadcast.delivered} delivered
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg" data-testid="opened-metric">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Opened
              </p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {broadcast.opened} opened
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg" data-testid="click-through-metric">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Click-Through
              </p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {broadcast.clickedThrough} click
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide font-medium">
                Engagement Rate
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                {engagementRate}%
              </p>
            </div>
          </div>

          {/* Timeline Chart */}
          <div
            data-testid="engagement-timeline"
            className="w-full h-32 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center"
          >
            <span className="text-slate-500 dark:text-slate-400">
              Engagement timeline chart
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <button
            onClick={() => onEdit(broadcast.id)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            {broadcast.status === 'draft' ? 'Continue Editing' : 'Edit'}
          </button>
        )}

        {canDuplicate && (
          <button
            onClick={() => onDuplicate(broadcast.id)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Duplicate Broadcast
          </button>
        )}

        {canCancel && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel Broadcast
          </button>
        )}

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Delete Broadcast?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this broadcast? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(broadcast.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Broadcast Confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Cancel Broadcast?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to cancel this scheduled broadcast? It will not be sent.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Keep Broadcast
              </button>
              <button
                onClick={() => {
                  onCancel(broadcast.id);
                  setShowCancelConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 text-white rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
