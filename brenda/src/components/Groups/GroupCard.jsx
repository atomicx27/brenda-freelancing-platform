import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';

const GroupCard = ({ group, onJoined }) => {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(group.isMember || false);
  const [requestPending, setRequestPending] = useState(group.hasPendingRequest || false);

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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {group.coverImage && (
        <div className="h-32 bg-gradient-to-r from-green-400 to-blue-500"></div>
      )}
      <div className="p-6">
        <Link to={`/groups/${group.slug}`}>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 hover:text-green-600">{group.name}</h3>
        </Link>
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
    </div>
  );
};

export default GroupCard;
