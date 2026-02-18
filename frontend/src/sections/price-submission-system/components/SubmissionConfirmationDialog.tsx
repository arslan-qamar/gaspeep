import React from 'react'
import type {
  SubmissionStep,
  ConfirmedSubmission,
  Station,
  FuelSubmissionEntry,
} from '../PriceSubmissionForm.types'

type SubmissionConfirmationDialogProps = {
  currentStep: SubmissionStep
  confirmed: ConfirmedSubmission | null
  station: Station | null
  onSubmitAnother: () => void
  onGoToMap: () => void
}

export const SubmissionConfirmationDialog: React.FC<SubmissionConfirmationDialogProps> = ({
  currentStep,
  confirmed,
  station,
  onSubmitAnother,
  onGoToMap,
}) => {
  if (currentStep !== 'confirm' || !confirmed) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="text-center">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thanks for contributing!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-5">Your submission has been received</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 mb-5">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Station:</span> {confirmed.station_name || confirmed.stationName || station?.name || 'Unknown'}
          </p>
          {Array.isArray(confirmed.submittedEntries) && confirmed.submittedEntries.length > 0 ? (
            confirmed.submittedEntries.map((entry: FuelSubmissionEntry) => (
              <p key={entry.fuelTypeId} className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">{entry.fuelTypeName}:</span> ${entry.price.toFixed(2)} /L
              </p>
            ))
          ) : (
            <>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Fuel:</span> {confirmed.fuel_type || confirmed.fuelTypeName || 'Unknown'}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">Price:</span> ${Number(confirmed.price || 0).toFixed(2)} /L
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onSubmitAnother}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Submit Another
          </button>
          <button
            onClick={onGoToMap}
            className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-900 dark:text-white transition-colors"
          >
            Go to Map
          </button>
        </div>
      </div>
    </div>
  )
}
