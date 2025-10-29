import React, { useState, useRef } from 'react'
import { FaPaperPlane, FaImage, FaFile, FaTimes, FaExclamationTriangle } from 'react-icons/fa'

const MessageInput = ({ onSendMessage, onSendFile, disabled = false }) => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ]

  // File validation functions
  const validateFile = (file, isImage = false) => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
    
    const allowedTypes = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES
    if (!allowedTypes.includes(file.type)) {
      return isImage 
        ? 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
        : 'Please select a valid file (PDF, DOC, DOCX, TXT, ZIP, RAR)'
    }
    
    return null
  }

  const clearError = () => {
    setError(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled && !uploading) {
      onSendMessage(message.trim())
      setMessage('')
      setIsTyping(false)
      clearError()
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const validationError = validateFile(file, false)
      if (validationError) {
        setError(validationError)
        e.target.value = ''
        return
      }

      try {
        setUploading(true)
        clearError()
        await onSendFile(file, 'FILE')
      } catch (error) {
        setError('Failed to send file. Please try again.')
        console.error('Error sending file:', error)
      } finally {
        setUploading(false)
        e.target.value = ''
      }
    }
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const validationError = validateFile(file, true)
      if (validationError) {
        setError(validationError)
        e.target.value = ''
        return
      }

      try {
        setUploading(true)
        clearError()
        await onSendFile(file, 'IMAGE')
      } catch (error) {
        setError('Failed to send image. Please try again.')
        console.error('Error sending image:', error)
      } finally {
        setUploading(false)
        e.target.value = ''
      }
    }
  }

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {/* Error Message */}
      {error && (
        <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={clearError}
            className="ml-auto p-1 hover:bg-red-200 rounded transition-colors"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* File upload buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || uploading}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send image"
          >
            <FaImage className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send file"
          >
            <FaFile className="w-5 h-5" />
          </button>
        </div>

        {/* Message input */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={uploading ? "Uploading..." : "Type a message..."}
            disabled={disabled || uploading}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '40px',
              maxHeight: '120px',
              height: 'auto'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled || uploading}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={uploading ? "Uploading..." : "Send message"}
        >
          <FaPaperPlane className="w-5 h-5" />
        </button>
      </form>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
      />
      
      <input
        ref={imageInputRef}
        type="file"
        onChange={handleImageSelect}
        className="hidden"
        accept="image/*"
      />

      {/* Status indicators */}
      {uploading && (
        <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Uploading file...
        </div>
      )}
      {isTyping && !uploading && (
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      )}
    </div>
  )
}

export default MessageInput
