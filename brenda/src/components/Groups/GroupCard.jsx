import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEllipsisV, FaCrown, FaTrash, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const GroupCard = ({ group, onJoined, onDeleted }) => {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(group.isMember || false);
  const [requestPending, setRequestPending] = useState(group.hasPendingRequest || false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user && group.createdBy === user.id;

  const handleJoin = async () => {
    if (joined || requestPending) return;
    setJoining(true);
    try {
      const response = await apiService.joinUserGroup(group.id);
      
      // Check if a join request was created instead of immediate membership
      if (response?.data?.request) {
        setRequestPending(true);
        alert('Join request submitted! Please wait for a moderator to approve.');
      } else {
        setJoined(true);
        if (onJoined) onJoined(group.id);
      }
    } catch (err) {
      // If backend says user is already a member, mark as joined to keep UI consistent
      const message = err?.message || (err?.response && err.response.message) || '';
      if (typeof message === 'string' && message.toLowerCase().includes('already a member')) {
        setJoined(true);
        if (onJoined) onJoined(group.id);
      } else if (typeof message === 'string' && message.toLowerCase().includes('request already pending')) {
        setRequestPending(true);
      }
      console.error('Join group failed', err);
    } finally {
      setJoining(false);
    }
  };

  const getButtonText = () => {
    if (joining) return 'Joining...';
    if (joined) return 'Joined';
    if (requestPending) return 'Pending Approval';
    return 'Join';
  };

  const getButtonClass = () => {
    if (joined) return 'bg-gray-300 text-gray-700';
    if (requestPending) return 'bg-yellow-500 text-white';
    return 'bg-green-600 text-white hover:bg-green-700';
  };

  const handleDeleteGroup = async () => {
    try {
      await apiService.deleteUserGroup(group.slug);
      setShowDeleteConfirm(false);
      setShowMenu(false);
      if (onDeleted) onDeleted(group.id);
      alert('Group deleted successfully');
    } catch (err) {
      console.error('Delete group failed', err);
      alert(err?.message || 'Failed to delete group');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
      {group.coverImage && (
        <div className="h-32 bg-gradient-to-r from-green-400 to-blue-500"></div>
      )}
      <div className="p-6">
        {/* Header with title and owner menu */}
        <div className="flex justify-between items-start mb-2">
          <Link to={`/groups/${group.slug}`} className="flex-1">
            <h3 className="text-xl font-semibold text-gray-800 hover:text-green-600">
              {group.name}
              {isOwner && (
                <FaCrown className="inline ml-2 text-yellow-500" title="You own this group" />
              )}
            </h3>
          </Link>
          
          {/* Owner Menu */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaEllipsisV className="text-gray-600" />
              </button>
              
              {showMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  
                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-200">
                    <Link
                      to={`/groups/${group.slug}/manage`}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      <FaUsers className="mr-3 text-blue-600" />
                      <span className="text-gray-700">Manage Members</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center px-4 py-3 hover:bg-red-50 transition-colors text-left"
                    >
                      <FaTrash className="mr-3 text-red-600" />
                      <span className="text-red-600">Delete Group</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{group.description}</p>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{group._count?.members ?? 0} members</span>
            <span>{group._count?.posts ?? 0} posts</span>
          </div>
          <div className="flex items-center space-x-2">
            {!group.isPublic && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Private</span>
            )}
            {group.requiresApproval && !group.isPublic && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Requires Approval</span>
            )}
          </div>
        </div>
        <button
          onClick={handleJoin}
          disabled={joining || joined || requestPending}
          className={`w-full px-3 py-2 rounded-md text-sm ${getButtonClass()}`}
        >
          {getButtonText()}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Group?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{group.name}</strong>? This action cannot be undone.
              All posts, members, and data will be permanently deleted.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupCard;
