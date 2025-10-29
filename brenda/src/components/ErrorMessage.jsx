import React from 'react'
import { FaExclamationTriangle, FaTimes, FaRedo, FaInfoCircle } from 'react-icons/fa'

const ErrorMessage = ({ 
  error, 
  onDismiss, 
  onRetry, 
  type = 'error',
  showRetry = true,
  className = ''
}) => {
  if (!error) return null

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <FaExclamationTriangle className="w-5 h-5" />
      case 'info':
        return <FaInfoCircle className="w-5 h-5" />
      default:
        return <FaExclamationTriangle className="w-5 h-5" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700'
      case 'info':
        return 'bg-blue-100 border-blue-400 text-blue-700'
      default:
        return 'bg-red-100 border-red-400 text-red-700'
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-red-600'
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${getBgColor()} ${className}`} role="alert">
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {type === 'error' && 'Error'}
            {type === 'warning' && 'Warning'}
            {type === 'info' && 'Information'}
          </h3>
          <div className="mt-2 text-sm">
            <p>{error}</p>
          </div>
          {(onRetry || onDismiss) && (
            <div className="mt-4 flex gap-2">
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-white hover:bg-gray-50 transition-colors"
                >
                  <FaRedo className="w-3 h-3" />
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-white hover:bg-gray-50 transition-colors"
                >
                  <FaTimes className="w-3 h-3" />
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={`inline-flex rounded-md p-1.5 hover:bg-opacity-20 transition-colors ${getIconColor()}`}
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage




