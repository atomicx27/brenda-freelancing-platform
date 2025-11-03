import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HeadTag from '../components/HeadTag.jsx'
import Footer from '../components/Footer.jsx'
import ConversationList from '../components/ConversationList.jsx'
import Message from '../components/Message.jsx'
import MessageInput from '../components/MessageInput.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import SuccessMessage from '../components/SuccessMessage.jsx'
import apiService from '../services/api'
import { FaArrowLeft, FaSearch, FaSpinner, FaUser } from 'react-icons/fa'

export default function Chat() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  
  // State
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState(null)
  
  // Refs
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setError(null)
      // Retry last failed operation when coming back online
      if (lastError) {
        handleRetry()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setError('You are currently offline. Please check your internet connection.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [lastError])

  // Error handling functions
  const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error)
    
    let errorMessage = 'Something went wrong. Please try again.'
    
    if (error.message) {
      if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection.'
      } else if (error.message.includes('429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (error.message.includes('401')) {
        errorMessage = 'Please log in to continue.'
        setTimeout(() => navigate('/account-security/login'), 2000)
      } else if (error.message.includes('403')) {
        errorMessage = 'You do not have permission to perform this action.'
      } else if (error.message.includes('404')) {
        errorMessage = 'The requested resource was not found.'
      } else {
        errorMessage = error.message
      }
    }
    
    setError(errorMessage)
    setLastError({ error, context })
    setRetryCount(prev => prev + 1)
  }

  const handleRetry = () => {
    setError(null)
    setLastError(null)
    setRetryCount(0)
    
    if (lastError) {
      switch (lastError.context) {
        case 'loadConversations':
          loadConversations()
          break
        case 'loadMessages':
          if (selectedConversation) {
            loadMessages(selectedConversation.user.id)
          }
          break
        case 'sendMessage':
          // Don't auto-retry sending messages
          break
        default:
          loadConversations()
      }
    }
  }

  const clearError = () => {
    setError(null)
    setLastError(null)
    setRetryCount(0)
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true)
      clearError()
      
      const response = await apiService.getConversations()
      setConversations(response.data.conversations)
      
      // If userId is provided, select that conversation
      if (userId) {
        // URL params are strings; ensure we compare IDs as strings to avoid type mismatch
        const conversation = response.data.conversations.find(
          conv => String(conv.user.id) === String(userId)
        )
        if (conversation) {
          setSelectedConversation(conversation)
          loadMessages(conversation.user.id)
        } else {
          // If there's no existing conversation, allow starting a new one.
          // Create a lightweight placeholder so the UI shows a composer.
          setSelectedConversation({
            user: {
              id: userId,
              firstName: 'User',
              lastName: '',
              avatar: null
            },
            isNewConversation: true
          })
          setMessages([])
        }
      }
    } catch (err) {
      handleError(err, 'loadConversations')
    } finally {
      setLoading(false)
    }
  }

  // Load messages for a conversation
  const loadMessages = async (targetUserId) => {
    try {
      setMessagesLoading(true)
      clearError()
      
      const response = await apiService.getConversation(targetUserId)
      setMessages(response.data.messages)
      
      // Mark messages as read
      const unreadMessages = response.data.messages.filter(
        msg => !msg.isRead && msg.senderId === targetUserId
      )
      if (unreadMessages.length > 0) {
        try {
          const messageIds = unreadMessages.map(msg => msg.id)
          await apiService.markMessagesAsRead(messageIds)
          updateUnreadCount()
          
          // Trigger a custom event to notify other components
          window.dispatchEvent(new CustomEvent('messagesRead', { 
            detail: { messageIds, userId: targetUserId } 
          }))
        } catch (markReadError) {
          console.warn('Failed to mark messages as read:', markReadError)
          // Don't show error for this, just log it
        }
      }
    } catch (err) {
      handleError(err, 'loadMessages')
    } finally {
      setMessagesLoading(false)
    }
  }

  // Send a message
  const handleSendMessage = async (content, overrideReceiverId = null) => {
    const receiverId = overrideReceiverId || selectedConversation?.user?.id
    if (!receiverId) {
      setError('No recipient selected')
      return
    }

    try {
      setSendingMessage(true)
      clearError()

      const response = await apiService.sendMessage({
        receiverId,
        content,
        messageType: 'TEXT'
      })

      const message = response.data

      // If we're already in the conversation with that user, append message
      if (selectedConversation && String(selectedConversation.user.id) === String(receiverId)) {
        setMessages(prev => [...prev, message])

        // Update conversation list
        setConversations(prev => 
          prev.map(conv => 
            String(conv.user.id) === String(receiverId)
              ? { ...conv, lastMessage: message }
              : conv
          )
        )
      } else {
        // New conversation: construct it from the server response
        const otherUser = message.senderId === user.id ? message.receiver : message.sender
        const newConversation = {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0
        }

        // Prepend to conversation list and select it
        setConversations(prev => [newConversation, ...prev])
        setSelectedConversation(newConversation)
        setMessages([message])
      }

      // Scroll to bottom
      setTimeout(scrollToBottom, 100)

      // Trigger event to update unread count in other components
      window.dispatchEvent(new CustomEvent('newMessageSent', { 
        detail: { message } 
      }))

      showSuccess('Message sent successfully!')
    } catch (err) {
      handleError(err, 'sendMessage')
      // Don't auto-retry sending messages to avoid duplicates
    } finally {
      setSendingMessage(false)
    }
  }

  // Send a file
  const handleSendFile = async (file, messageType = 'FILE') => {
    if (!selectedConversation) return

    try {
      setSendingMessage(true)
      clearError()
      
      // Upload file first
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadResponse = await apiService.uploadFile(formData)
      const fileUrl = uploadResponse.data.url

      // Send message with file
      const response = await apiService.sendMessage({
        receiverId: selectedConversation.user.id,
        content: `Sent a ${messageType === 'IMAGE' ? 'image' : 'file'}`,
        messageType,
        attachment: fileUrl
      })

      // Add message to local state
      setMessages(prev => [...prev, response.data])
      
      // Update conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv.user.id === selectedConversation.user.id
            ? { ...conv, lastMessage: response.data }
            : conv
        )
      )

      // Scroll to bottom
      setTimeout(scrollToBottom, 100)
      
      // Trigger event to update unread count in other components
      window.dispatchEvent(new CustomEvent('newMessageSent', { 
        detail: { message: response.data } 
      }))
      
      showSuccess(`${messageType === 'IMAGE' ? 'Image' : 'File'} sent successfully!`)
    } catch (err) {
      handleError(err, 'sendFile')
      // Don't auto-retry sending files to avoid duplicates
    } finally {
      setSendingMessage(false)
    }
  }

  // Delete a message
  const handleDeleteMessage = async (messageId) => {
    try {
      clearError()
      await apiService.deleteMessage(messageId)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      showSuccess('Message deleted successfully!')
    } catch (err) {
      handleError(err, 'deleteMessage')
    }
  }

  // Select a conversation
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    setSearchQuery('')
    loadMessages(conversation.user.id)
  }

  // Update unread count
  const updateUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadCount()
      setUnreadCount(response.data.unreadCount)
    } catch (err) {
      console.warn('Error updating unread count:', err)
      // Don't show error for this, just log it
    }
  }

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation =>
    conversation.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Effects
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadConversations()
      updateUnreadCount()
    }
  }, [isAuthenticated, authLoading])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access messages.</p>
          <button
            onClick={() => navigate('/account-security/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title="Messages - Brenda"/>
      
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-4 mt-2">
            <SuccessMessage 
              message={successMessage} 
              onDismiss={() => setSuccessMessage(null)}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-2">
            <ErrorMessage 
              error={error}
              onDismiss={clearError}
              onRetry={handleRetry}
              showRetry={retryCount < 3 && lastError?.context !== 'sendMessage' && lastError?.context !== 'sendFile'}
            />
          </div>
        )}

        {/* Network Status */}
        {!isOnline && (
          <div className="mx-4 mt-2">
            <ErrorMessage 
              error="You are currently offline. Please check your internet connection."
              type="warning"
              showRetry={false}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
            <ConversationList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              loading={loading}
            />
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {selectedConversation.user.avatar ? (
                      <img
                        src={selectedConversation.user.avatar}
                        alt={selectedConversation.user.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {selectedConversation.user.firstName[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="font-medium text-gray-900">
                        {selectedConversation.user.firstName} {selectedConversation.user.lastName}
                      </h2>
                      <p className="text-sm text-gray-500">Online</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner size="lg" text="Loading messages..." />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <FaUser className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <Message
                        key={message.id}
                        message={message}
                        isOwn={message.senderId === user.id}
                        onDelete={handleDeleteMessage}
                        currentUserId={user.id}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  onSendFile={handleSendFile}
                  disabled={sendingMessage}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FaUser className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer/>
    </div>
  )
}
