import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  steps: Array<{
    number: number;
    title: string;
  }>;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <div className="w-full mb-8">
      {/* Desktop view - horizontal */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex items-center">
              {/* Circle indicator */}
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${
                    step.number < currentStep
                      ? 'bg-green-500 border-green-500'
                      : step.number === currentStep
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                  }
                `}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span
                    className={`
                      text-sm font-semibold
                      ${
                        step.number === currentStep
                          ? 'text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }
                    `}
                  >
                    {step.number}
                  </span>
                )}
              </div>

              {/* Step title */}
              <div className="ml-3">
                <div
                  className={`
                    text-sm font-medium
                    ${
                      step.number <= currentStep
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  {step.title}
                </div>
              </div>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4 h-0.5 bg-slate-300 dark:bg-slate-600">
                <div
                  className={`
                    h-full transition-all
                    ${step.number < currentStep ? 'bg-green-500 w-full' : 'w-0'}
                  `}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile view - compact */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`
                flex-1 h-1 mx-1 rounded-full transition-all
                ${
                  step.number < currentStep
                    ? 'bg-green-500'
                    : step.number === currentStep
                    ? 'bg-blue-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }
              `}
            />
          ))}
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </div>
        </div>
      </div>
    </div>
  );
};
