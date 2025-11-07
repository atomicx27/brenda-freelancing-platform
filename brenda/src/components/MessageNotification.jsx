import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import apiService from '../services/api'
import { FaBell, FaCircle } from 'react-icons/fa'

const MessageNotification = () => {
  const authContext = useContext(AuthContext)
  const isAuthenticated = authContext?.isAuthenticated || false
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      // Initial load
      loadUnreadCount()
      
      // Poll for unread count every 2 minutes (further reduced frequency)
      const interval = setInterval(() => {
        loadUnreadCount()
      }, 300000) // Poll every 5 minutes
      
      // Listen for messages being read
      const handleMessagesRead = () => {
        // Refresh unread count when messages are read
        setTimeout(() => loadUnreadCount(), 1000)
      }
      
      // Listen for new messages being sent
      const handleNewMessageSent = () => {
        // Refresh unread count when new messages are sent
        setTimeout(() => loadUnreadCount(), 1000)
      }
      
      window.addEventListener('messagesRead', handleMessagesRead)
      window.addEventListener('newMessageSent', handleNewMessageSent)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('messagesRead', handleMessagesRead)
        window.removeEventListener('newMessageSent', handleNewMessageSent)
      }
    } else {
      // Reset count when not authenticated
      setUnreadCount(0)
    }
  }, [isAuthenticated])

  const loadUnreadCount = async () => {
    // Prevent multiple simultaneous requests
    if (loading) return
    
    // Prevent too frequent requests (minimum 2 minutes between requests)
    const now = Date.now()
    if (now - lastFetch < 120000) return
    
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    try {
      setLoading(true)
      setLastFetch(now)
      const response = await apiService.getUnreadCount()
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      // Only log non-rate-limit and non-network errors
      if (!error.message?.includes('429') && 
          !error.message?.includes('Too Many Requests') &&
          !error.message?.includes('Network Error') &&
          !error.message?.includes('Failed to fetch') &&
          !error.message?.includes('Access denied')) {
        console.warn('Error loading unread count:', error)
      }
      // Don't update unread count on error to avoid showing 0 when there might be messages
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="relative">
      <FaBell className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  )
}

export default MessageNotification
