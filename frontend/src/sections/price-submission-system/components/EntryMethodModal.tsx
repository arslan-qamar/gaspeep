import React from 'react'
import { VoiceInputScreen } from '../VoiceInputScreen'
import { PhotoUploadScreen } from '../PhotoUploadScreen'
import type { VoiceParseResult } from '../voicePriceParser'
import type { FuelType, VoiceReviewEntry } from '../PriceSubmissionForm.types'

type EntryMethodModalProps = {
  showModal: boolean
  method: 'text' | 'voice' | 'photo'
  voiceParseResult: VoiceParseResult | null
  voiceReviewEntries: VoiceReviewEntry[]
  setVoiceReviewEntries: React.Dispatch<React.SetStateAction<VoiceReviewEntry[]>>
  voiceReviewError: string | null
  fuelTypesList: FuelType[]
  applyVoiceSelections: () => void
  resetVoiceFlow: () => void
  onClose: () => void
  onVoiceParsed: (data: VoiceParseResult) => void
  onPhotoParsed: (data: { fuelType: string; price: number }) => void
}

export const EntryMethodModal: React.FC<EntryMethodModalProps> = ({
  showModal,
  method,
  voiceParseResult,
  voiceReviewEntries,
  setVoiceReviewEntries,
  voiceReviewError,
  fuelTypesList,
  applyVoiceSelections,
  resetVoiceFlow,
  onClose,
  onVoiceParsed,
  onPhotoParsed,
}) => {
  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {method === 'voice' ? (voiceParseResult ? 'Confirm Detected Prices' : 'Voice Entry') : 'Camera / Photo Entry'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        <div className="p-6">
          {method === 'voice' && (
            voiceParseResult ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Transcript</p>
                  <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{voiceParseResult.transcript}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Detected prices</h4>
                  {voiceReviewEntries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={entry.selected}
                            onChange={(event) => {
                              const checked = event.target.checked
                              setVoiceReviewEntries((previous) =>
                                previous.map((item) =>
                                  item.id === entry.id ? { ...item, selected: checked } : item
                                )
                              )
                            }}
                          />
                          Apply this entry
                        </label>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {entry.confidence >= 0.9 ? 'High' : entry.confidence >= 0.8 ? 'Medium' : 'Low'} confidence
                        </span>
                      </div>

                      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                        Heard: <span className="font-medium">{entry.spokenFuel}</span>
                      </p>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <select
                          aria-label={`Fuel type for ${entry.spokenFuel}`}
                          value={entry.fuelTypeId}
                          onChange={(event) => {
                            const nextFuelTypeId = event.target.value
                            setVoiceReviewEntries((previous) =>
                              previous.map((item) =>
                                item.id === entry.id ? { ...item, fuelTypeId: nextFuelTypeId } : item
                              )
                            )
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        >
                          <option value="">Select fuel</option>
                          {fuelTypesList.map((fuelOption) => (
                            <option key={fuelOption.id} value={fuelOption.id}>
                              {fuelOption.displayName || fuelOption.name}
                            </option>
                          ))}
                        </select>

                        <input
                          aria-label={`Price for ${entry.spokenFuel}`}
                          inputMode="decimal"
                          value={entry.price}
                          onChange={(event) => {
                            const nextPrice = event.target.value
                            setVoiceReviewEntries((previous) =>
                              previous.map((item) =>
                                item.id === entry.id ? { ...item, price: nextPrice } : item
                              )
                            )
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {voiceReviewError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                    <p className="text-sm text-red-600 dark:text-red-400">{voiceReviewError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={applyVoiceSelections}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Apply Selected
                  </button>
                  <button
                    type="button"
                    onClick={resetVoiceFlow}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Record Again
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <VoiceInputScreen
                fuelTypes={fuelTypesList}
                onParsed={onVoiceParsed}
                onCancel={onClose}
                isModal={true}
              />
            )
          )}

          {method === 'photo' && (
            <PhotoUploadScreen
              onParsed={onPhotoParsed}
              onCancel={onClose}
              isModal={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
