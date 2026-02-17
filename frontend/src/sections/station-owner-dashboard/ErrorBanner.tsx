import React, { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ErrorBannerProps {
  error: string | null
  onRetry?: () => void
  onDismiss?: () => void
  autoDismissAfter?: number // milliseconds
}

/**
 * ErrorBanner Component
 * Displays error messages with retry and dismiss options
 */
export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
  autoDismissAfter = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(!!error)

  useEffect(() => {
    setIsVisible(!!error)
    if (error && autoDismissAfter) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, autoDismissAfter)
      return () => clearTimeout(timer)
    }
  }, [error, autoDismissAfter, onDismiss])

  if (!isVisible || !error) {
    return null
  }

  return (
    <div className="fixed top-20 left-0 right-0 mx-4 sm:mx-auto sm:max-w-2xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-100">
            {error || 'An error occurred'}
          </p>
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <button
                onClick={() => {
                  onRetry()
                  setIsVisible(false)
                }}
                className="text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => {
                setIsVisible(false)
                onDismiss?.()
              }}
              className="text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            onDismiss?.()
          }}
          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          aria-label="Dismiss error"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
