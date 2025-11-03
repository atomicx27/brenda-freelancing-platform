import React, { useState } from 'react';
import apiService from '../../services/api';

const GroupCard = ({ group, onJoined }) => {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(group.isMember || false);

  const handleJoin = async () => {
    if (joined) return;
    setJoining(true);
    try {
      await apiService.joinUserGroup(group.id);
      setJoined(true);
      if (onJoined) onJoined(group.id);
    } catch (err) {
      console.error('Join group failed', err);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {group.coverImage && (
        <div className="h-32 bg-gradient-to-r from-green-400 to-blue-500"></div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{group.name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{group.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{group._count?.members ?? 0} members</span>
            <span>{group._count?.posts ?? 0} posts</span>
          </div>
          <button
            onClick={handleJoin}
            disabled={joining || joined}
            className={`px-3 py-1 rounded-md text-sm ${joined ? 'bg-gray-300 text-gray-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            {joining ? 'Joining...' : (joined ? 'Joined' : 'Join')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
