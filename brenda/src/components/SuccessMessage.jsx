import React, { useEffect, useState } from 'react'
import { FaCheckCircle, FaTimes } from 'react-icons/fa'

const SuccessMessage = ({ 
  message, 
  onDismiss, 
  autoHide = true,
  duration = 3000,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide && message) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onDismiss) {
          setTimeout(onDismiss, 300) // Wait for animation
        }
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [message, autoHide, duration, onDismiss])

  if (!message || !isVisible) return null

  return (
    <div className={`bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg ${className}`} role="alert">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <FaCheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(onDismiss, 300)
              }}
              className="inline-flex rounded-md p-1.5 text-green-600 hover:bg-green-200 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SuccessMessage




