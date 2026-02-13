import React, { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api'
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export type HistoryRecord = {
  id: string
  station_name: string
  fuel_type: string
  price: number
  submittedAt: string
  moderationStatus?: string
}

const PriceSubmissionHistory: React.FC = () => {
  const [items, setItems] = useState<HistoryRecord[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const resp = await apiClient.get('/price-submissions/my-submissions')
      const payload = resp.data
      // backend may return either an array or an object with `submissions`
      const data = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.submissions) ? payload.submissions : [])
      // normalize records to HistoryRecord shape
      const normalized = (data || []).map((r: any) => ({
        id: r.id,
        station_name: r.station_name || r.station?.name || r.stationName || r.stationId,
        fuel_type: r.fuel_type || r.fuelTypeName || r.fuel_type_name || r.fuelTypeId,
        price: r.price,
        submittedAt: r.submittedAt || r.createdAt || r.submitted_at || new Date().toISOString(),
        moderationStatus: r.moderationStatus || r.status || r.moderation_status || 'pending',
      }))
      setItems(normalized)
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load submissions')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'published':
        return <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
      case 'pending':
        return <Clock size={16} className="text-yellow-600 dark:text-yellow-400" />
      case 'rejected':
        return <XCircle size={16} className="text-red-600 dark:text-red-400" />
      default:
        return <AlertCircle size={16} className="text-slate-600 dark:text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'published':
        return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950'
      case 'pending':
        return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950'
      case 'rejected':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950'
      default:
        return 'text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-950'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-center p-8">
          <RefreshCw size={24} className="animate-spin text-slate-400 dark:text-slate-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
            Unable to load submissions: {error}
          </p>
          <button
            onClick={load}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Submissions</h3>
          <button
            onClick={load}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-slate-400 dark:text-slate-600 mb-2">📝</div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You have no recent submissions
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent Submissions
          </h3>
          <button
            onClick={load}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <ul className="space-y-3">
          {items.slice(0, 5).map((it) => (
            <li
              key={it.id}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white truncate">
                    {it.station_name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {it.fuel_type} · <span className="font-semibold">${it.price?.toFixed(2)}</span>/L
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {formatDate(it.submittedAt)}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(it.moderationStatus || 'pending')}`}>
                  {getStatusIcon(it.moderationStatus || 'pending')}
                  <span className="capitalize">{it.moderationStatus || 'Pending'}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {items.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all {items.length} submissions
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PriceSubmissionHistory
