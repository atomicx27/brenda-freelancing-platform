import React from 'react'
import { FaSpinner } from 'react-icons/fa'

const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  showText = true 
}) => {
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-8 h-8'
      case 'xl':
        return 'w-12 h-12'
      default:
        return 'w-6 h-6'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'lg':
        return 'text-lg'
      case 'xl':
        return 'text-xl'
      default:
        return 'text-base'
    }
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <FaSpinner className={`${getSize()} animate-spin text-blue-600`} />
        {showText && text && (
          <p className={`${getTextSize()} text-gray-600`}>{text}</p>
        )}
      </div>
    </div>
  )
}

export default LoadingSpinner




