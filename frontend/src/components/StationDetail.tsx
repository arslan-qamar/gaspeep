import { X, MapPin, Clock, Star } from 'lucide-react'
import type { Station, FuelPrice } from '../lib/api'

interface StationDetailProps {
  station: Station
  prices: FuelPrice[]
  onClose: () => void
}

export function StationDetail({ station, prices, onClose }: StationDetailProps) {
  // Sort prices by fuel type display order
  const sortedPrices = [...prices].sort((a, b) => {
    const nameA = a.fuelType?.displayName || ''
    const nameB = b.fuelType?.displayName || ''
    return nameA.localeCompare(nameB)
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getVerificationBadge = (status: string) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          ✓ Verified
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        Unverified
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {station.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{station.brand}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)] px-6 py-4">
          {/* Station Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{station.address}</span>
            </div>

            {station.operatingHours && (
              <div className="flex items-start text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{station.operatingHours}</span>
              </div>
            )}

            {station.amenities && station.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {station.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Fuel Prices */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Fuel Prices
            </h3>

            {sortedPrices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No prices available for this station</p>
                <p className="text-sm mt-2">Be the first to submit a price!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPrices.map((price) => (
                  <div
                    key={price.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: price.fuelType?.colorCode || '#6B7280',
                        }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {price.fuelType?.displayName || price.fuelTypeId}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            Updated {formatDate(price.lastUpdatedAt)}
                          </p>
                          {price.confirmationCount > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Star className="w-3 h-3 mr-1" />
                              {price.confirmationCount} confirmation{price.confirmationCount !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {price.currency} {price.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        per {price.unit}
                      </div>
                      <div className="mt-1">
                        {getVerificationBadge(price.verificationStatus)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
            <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Submit Price
            </button>
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Get Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
