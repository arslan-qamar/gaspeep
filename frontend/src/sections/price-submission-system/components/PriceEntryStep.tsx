import React from 'react'
import type { Station, FuelType } from '../PriceSubmissionForm.types'

type PriceEntryStepProps = {
  station: Station | null
  fuelTypesList: FuelType[]
  fuelType: string
  pricesByFuelType: Record<string, string>
  setPricesByFuelType: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setFuelType: React.Dispatch<React.SetStateAction<string>>
  error: string | null
  loading: boolean
  canSubmit: boolean
  onBack: () => void
  onSubmit: () => void
  onVoiceEntry: () => void
  onPhotoEntry: () => void
}

export const PriceEntryStep: React.FC<PriceEntryStepProps> = ({
  station,
  fuelTypesList,
  fuelType,
  pricesByFuelType,
  setPricesByFuelType,
  setFuelType,
  error,
  loading,
  canSubmit,
  onBack,
  onSubmit,
  onVoiceEntry,
  onPhotoEntry,
}) => (
  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
    <div className="flex items-start justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Enter Price Details</h2>
        {station && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {station.name} {station.address ? `• ${station.address}` : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onVoiceEntry}
          title="Voice Entry"
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="text-lg">🎤</span>
        </button>
        <button
          onClick={onPhotoEntry}
          title="Camera / Photo Entry"
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span className="text-lg">📸</span>
        </button>
      </div>
    </div>

    <div className="mb-6">
      <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Fuel Prices (cents) *</label>
      <div className="space-y-3">
        {fuelTypesList.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading fuel types...</p>
        ) : (
          fuelTypesList.map((f) => {
            const isHighlighted = fuelType === f.id
            return (
              <div key={f.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_2fr] gap-2 items-center">
                <label
                  htmlFor={`fuel-price-${f.id}`}
                  className={`text-sm ${
                    isHighlighted
                      ? 'font-semibold text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f.displayName || f.name}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 dark:text-slate-300">c</span>
                  <input
                    id={`fuel-price-${f.id}`}
                    inputMode="numeric"
                    value={pricesByFuelType[f.id] || ''}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      setPricesByFuelType((prev) => ({
                        ...prev,
                        [f.id]: nextValue,
                      }))
                      setFuelType(f.id)
                    }}
                    placeholder="379"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-slate-600 dark:text-slate-400">c/L</span>
                </div>
              </div>
            )
          })
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Enter whole cents only (example: 379 means $3.79/L).</p>
    </div>

    {error && (
      <div className="mb-6 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={onBack}
        className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-900 dark:text-white transition-colors"
      >
        Back
      </button>
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
          !canSubmit
            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Submitting...' : 'Submit Price'}
      </button>
    </div>
  </div>
)
