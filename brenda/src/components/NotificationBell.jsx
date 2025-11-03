import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Optionally pre-load a small set
    loadNotifications();
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const resp = await apiService.getNotifications();
      setNotifications(resp.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  return !isAuthenticated ? null : (
    <div className="relative">
      <button
        className="relative"
        onClick={async () => {
          setOpen(!open);
          if (!open) await loadNotifications();
        }}
        aria-label="Notifications"
      >
        <FaBell className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors" />
        {notifications.some(n => !n.isRead) && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <strong>Notifications</strong>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-gray-500">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 border-b ${n.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                  <div className="text-sm text-gray-800">{n.data?.message || 'You have a notification'}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
