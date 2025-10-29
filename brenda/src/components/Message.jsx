import React from 'react'
import { FaTrash, FaDownload, FaImage } from 'react-icons/fa'

const Message = ({ message, isOwn, onDelete, currentUserId }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete(message.id)
    }
  }

  const renderAttachment = () => {
    if (!message.attachment) return null

    if (message.messageType === 'IMAGE') {
      return (
        <div className="mt-2">
          <img
            src={message.attachment}
            alt="Attachment"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.attachment, '_blank')}
          />
        </div>
      )
    }

    if (message.messageType === 'FILE') {
      const fileName = message.attachment.split('/').pop()
      return (
        <div className="mt-2 p-3 bg-gray-100 rounded-lg flex items-center gap-3">
          <FaDownload className="text-gray-600" />
          <span className="text-sm text-gray-700 flex-1 truncate">{fileName}</span>
          <button
            onClick={() => window.open(message.attachment, '_blank')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Download
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Avatar and name for received messages */}
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.firstName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {message.sender.firstName[0]}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-600 font-medium">
              {message.sender.firstName} {message.sender.lastName}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          {/* Message content */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Attachment */}
          {renderAttachment()}

          {/* Timestamp */}
          <div
            className={`text-xs mt-1 ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {formatTime(message.createdAt)}
            {!message.isRead && isOwn && (
              <span className="ml-1">• Unread</span>
            )}
          </div>

          {/* Delete button for own messages */}
          {isOwn && (
            <button
              onClick={handleDelete}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete message"
            >
              <FaTrash className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Message


