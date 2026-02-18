import React from 'react'
import type { StepMeta } from '../PriceSubmissionForm.types'

type SubmissionHeaderProps = {
  currentStepNumber: number
  steps: StepMeta[]
}

export const SubmissionHeader: React.FC<SubmissionHeaderProps> = ({ currentStepNumber, steps }) => (
  <>
    <div>
      <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Submit Fuel Price</h1>
      <p className="text-slate-600 dark:text-slate-400">Step {currentStepNumber} of 3: {steps[currentStepNumber - 1].label}</p>
    </div>

    <div className="flex gap-2">
      {steps.map((step) => (
        <div
          key={step.number}
          className={`flex-1 h-2 rounded-full transition-colors ${
            step.number <= currentStepNumber
              ? 'bg-blue-600 dark:bg-blue-500'
              : 'bg-slate-200 dark:bg-slate-700'
          }`}
          aria-label={`Step ${step.number}: ${step.label}`}
        />
      ))}
    </div>
  </>
)
