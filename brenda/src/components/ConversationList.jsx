import React from 'react'
import { FaSearch, FaCircle } from 'react-icons/fa'
import LoadingSpinner from './LoadingSpinner.jsx'

const ConversationList = ({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  searchQuery, 
  onSearchChange,
  loading 
}) => {
  const formatLastMessageTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateMessage = (message, maxLength = 50) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="md" text="Loading conversations..." />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a conversation by applying to a job!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => {
              const isSelected = selectedConversation?.user.id === conversation.user.id
              const lastMessage = conversation.lastMessage
              const isLastMessageFromOther = lastMessage.senderId === conversation.user.id
              
              return (
                <div
                  key={conversation.user.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      {conversation.user.avatar ? (
                        <img
                          src={conversation.user.avatar}
                          alt={conversation.user.firstName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600">
                            {conversation.user.firstName[0]}
                          </span>
                        </div>
                      )}
                      
                      {/* Unread indicator */}
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.user.firstName} {conversation.user.lastName}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatLastMessageTime(lastMessage.createdAt)}
                        </span>
                      </div>
                      
                      <p className={`text-sm truncate ${
                        conversation.unreadCount > 0 && isLastMessageFromOther
                          ? 'font-medium text-gray-900'
                          : 'text-gray-600'
                      }`}>
                        {isLastMessageFromOther ? '' : 'You: '}
                        {truncateMessage(lastMessage.content)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationList
