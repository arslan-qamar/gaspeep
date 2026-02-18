import React, { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api'
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

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
  const [loadingAll, setLoadingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number } | null>(null)

  const fetchSubmissions = async (page = 1) => {
    const resp = await apiClient.get('/price-submissions/my-submissions', { params: { page } })
    const payload = resp.data
    const data = Array.isArray(payload)
      ? payload
      : payload && Array.isArray(payload.submissions)
      ? payload.submissions
      : []
    const pageInfo = payload && payload.pagination ? payload.pagination : null
    const normalized = (data || []).map((r: any) => ({
      id: r.id,
      station_name: r.station_name || r.station?.name || r.stationName || r.stationId,
      fuel_type: r.fuel_type || r.fuelTypeName || r.fuel_type_name || r.fuelTypeId,
      price: r.price,
      submittedAt: r.submittedAt || r.createdAt || r.submitted_at || new Date().toISOString(),
      moderationStatus: r.moderationStatus || r.status || r.moderation_status || 'pending',
    }))

    return {
      items: normalized,
      pagination: pageInfo ? { page: pageInfo.page || 1, limit: pageInfo.limit || normalized.length || 0, total: pageInfo.total || normalized.length || 0 } : null,
    }
  }

  const loadAll = async () => {
    const pageInfo = pagination
    if (!pageInfo) return setExpanded(true)
    const { page, limit, total } = pageInfo
    const pages = Math.max(1, Math.ceil(total / limit))
    if (pages <= page) {
      setExpanded(true)
      return
    }

    setLoadingAll(true)
    try {
      const results: HistoryRecord[] = []
      for (let p = page + 1; p <= pages; p++) {
        const resp = await fetchSubmissions(p)
        results.push(...(resp.items || []))
      }

      setItems((prev) => (prev ? [...prev, ...results] : results))
      setExpanded(true)
    } catch (e) {
      console.error('Failed to load all submissions', e)
    } finally {
      setLoadingAll(false)
    }
  }

  const { data, isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: ['my-submissions', 1],
    queryFn: () => fetchSubmissions(1),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })


  useEffect(() => {
    if (data) {
      setItems(data.items || [])
      setPagination(data.pagination)
      setError(null)
    } else if (!isLoading) {
      setItems([])
    }
    if (isError) {
      setError((queryError as any)?.response?.data?.error || (queryError as Error)?.message || 'Failed to load submissions')
    }
  }, [data, isLoading, isError, queryError])


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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">My Submissions</h1>
          <p className="text-slate-600 dark:text-slate-400">Track your recent fuel price updates</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw size={24} className="animate-spin text-slate-400 dark:text-slate-600" />
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                Unable to load submissions: {error}
              </p>
              <button
                onClick={() => refetch()}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : !items || items.length === 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Submissions</h3>
                <button
                  onClick={() => refetch()}
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
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Recent Submissions
                </h3>
                <button
                  onClick={() => refetch()}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>

              <ul className="space-y-3">
                {(expanded ? items : items.slice(0, 5)).map((it) => (
                  <li
                    key={it.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
                  <button
                    onClick={async () => {
                      if (expanded) {
                        setExpanded(false)
                      } else {
                        // if backend pagination already returned all items, just expand
                        if (pagination && items && items.length >= (pagination.total || 0)) {
                          setExpanded(true)
                        } else {
                          await loadAll()
                        }
                      }
                    }}
                    aria-label={expanded ? `Show fewer submissions` : `View all ${items.length} submissions`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {expanded ? 'Show less' : `View all ${pagination?.total ?? items.length} submissions`}
                    {loadingAll && <span className="ml-2">…</span>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PriceSubmissionHistory
