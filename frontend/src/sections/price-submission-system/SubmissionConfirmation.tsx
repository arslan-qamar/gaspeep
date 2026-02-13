import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, MapPin, Fuel, DollarSign, Clock } from 'lucide-react'

export const SubmissionConfirmation: React.FC<{ submission: any; onDone: () => void }> = ({ submission, onDone }) => {
  const navigate = useNavigate()
  const stationName = submission.station_name || submission.stationName || submission.station || 'Unknown'
  const fuelName = submission.fuel_type || submission.fuelTypeName || submission.fuelType || 'Unknown'
  const status = submission.moderationStatus || submission.moderation_status || 'pending'

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'published':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950'
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950'
      case 'rejected':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950'
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'published':
        return 'Published'
      case 'pending':
        return 'Pending Review'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-950 rounded-full p-4">
              <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
            Thanks for contributing!
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
            Your submission has been received
          </p>

          {/* Submission Details Card */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-slate-500 dark:text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Station
                </div>
                <div className="font-medium text-slate-900 dark:text-white">{stationName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Fuel size={20} className="text-slate-500 dark:text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Fuel Type
                </div>
                <div className="font-medium text-slate-900 dark:text-white">{fuelName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign size={20} className="text-slate-500 dark:text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Price
                </div>
                <div className="font-medium text-slate-900 dark:text-white">
                  ${submission.price?.toFixed(2) || '0.00'} /L
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={20} className="text-slate-500 dark:text-slate-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Status
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                  {getStatusLabel(status)}
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {status.toLowerCase() === 'pending' && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                🔍 Your submission is being reviewed. We'll verify it within 2 hours and update the map once approved.
              </p>
            </div>
          )}

          {status.toLowerCase() === 'approved' || status.toLowerCase() === 'published' ? (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                ✅ Your submission is now live on the map! Thanks for helping the community.
              </p>
            </div>
          ) : null}

          {/* Contribution Stats (optional) */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-100 dark:border-blue-900">
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
              🎉 Great work!
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              You're helping drivers save money on fuel.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDone}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              Submit Another
            </button>
            <button
              onClick={() => {
                try {
                  onDone()
                } finally {
                  navigate('/map')
                }
              }}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-900 dark:text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubmissionConfirmation
