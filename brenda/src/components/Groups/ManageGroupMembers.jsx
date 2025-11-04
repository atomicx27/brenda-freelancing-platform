import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBan, FaUserMinus, FaUndo, FaCrown, FaShieldAlt, FaUser } from 'react-icons/fa';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ManageGroupMembers = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('members');
  const [loading, setLoading] = useState(true);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [slug]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const [groupRes, membershipRes] = await Promise.all([
        apiService.getGroupBySlug(slug),
        apiService.checkGroupMembership(slug)
      ]);

      const groupData = groupRes.data.group;
      setGroup(groupData);

      // Check if user is owner
      if (groupData.createdBy !== user?.id) {
        alert('Only the group owner can access this page');
        navigate(`/groups/${slug}`);
        return;
      }

      // Load members and banned users
      await Promise.all([
        loadMembers(groupData.id),
        loadBannedUsers()
      ]);
    } catch (err) {
      console.error('Failed to load group data', err);
      alert('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (groupId) => {
    try {
      const res = await apiService.getGroupMembers(slug);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to load members', err);
    }
  };

  const loadBannedUsers = async () => {
    try {
      const res = await apiService.getGroupBannedUsers(slug);
      setBannedUsers(res.data.bannedUsers || []);
    } catch (err) {
      console.error('Failed to load banned users', err);
    }
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!confirm(`Remove ${userName} from the group?`)) return;
    
    try {
      setProcessing(true);
      await apiService.removeGroupMember(group.id, userId);
      setMembers(prev => prev.filter(m => m.userId !== userId));
      alert('User removed successfully');
    } catch (err) {
      console.error('Failed to remove user', err);
      alert(err?.message || 'Failed to remove user');
    } finally {
      setProcessing(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    try {
      setProcessing(true);
      await apiService.banUserFromGroup(slug, selectedUser.userId, banReason);
      
      // Remove from members list
      setMembers(prev => prev.filter(m => m.userId !== selectedUser.userId));
      
      // Reload banned users
      await loadBannedUsers();
      
      setBanModalOpen(false);
      setSelectedUser(null);
      setBanReason('');
      alert('User banned successfully');
    } catch (err) {
      console.error('Failed to ban user', err);
      alert(err?.message || 'Failed to ban user');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnbanUser = async (userId, userName) => {
    if (!confirm(`Unban ${userName}?`)) return;
    
    try {
      setProcessing(true);
      await apiService.unbanUserFromGroup(slug, userId);
      setBannedUsers(prev => prev.filter(b => b.userId !== userId));
      alert('User unbanned successfully');
    } catch (err) {
      console.error('Failed to unban user', err);
      alert(err?.message || 'Failed to unban user');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'OWNER':
        return <FaCrown className="text-yellow-500" title="Owner" />;
      case 'MODERATOR':
        return <FaShieldAlt className="text-blue-500" title="Moderator" />;
      default:
        return <FaUser className="text-gray-400" title="Member" />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'OWNER':
        return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Owner</span>;
      case 'MODERATOR':
        return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Moderator</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Member</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Group not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/groups/${slug}`)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Group
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Manage {group.name}</h1>
          <p className="text-gray-600 mt-2">Manage members and banned users</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'members'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Members ({members.length})
              </button>
              <button
                onClick={() => setActiveTab('banned')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'banned'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Banned Users ({bannedUsers.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'members' && (
              <div className="space-y-3">
                {members.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No members found. You may need to add a backend endpoint to fetch group members.</p>
                  </div>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {member.user?.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.firstName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-semibold">
                              {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-800">
                              {member.user?.firstName} {member.user?.lastName}
                            </p>
                            {getRoleIcon(member.role)}
                          </div>
                          <div className="mt-1">
                            {getRoleBadge(member.role)}
                          </div>
                        </div>
                      </div>

                      {member.role !== 'OWNER' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRemoveUser(member.userId, `${member.user?.firstName} ${member.user?.lastName}`)}
                            disabled={processing}
                            className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors flex items-center space-x-2"
                          >
                            <FaUserMinus />
                            <span>Remove</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(member);
                              setBanModalOpen(true);
                            }}
                            disabled={processing}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                          >
                            <FaBan />
                            <span>Ban</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'banned' && (
              <div className="space-y-3">
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaBan className="mx-auto text-4xl mb-4 text-gray-300" />
                    <p>No banned users</p>
                  </div>
                ) : (
                  bannedUsers.map((ban) => (
                    <div
                      key={ban.id}
                      className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {ban.user?.avatar ? (
                          <img
                            src={ban.user.avatar}
                            alt={ban.user.firstName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                            <span className="text-red-700 font-semibold">
                              {ban.user?.firstName?.[0]}{ban.user?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {ban.user?.firstName} {ban.user?.lastName}
                          </p>
                          {ban.reason && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Reason:</strong> {ban.reason}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Banned {new Date(ban.bannedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnbanUser(ban.userId, `${ban.user?.firstName} ${ban.user?.lastName}`)}
                        disabled={processing}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <FaUndo />
                        <span>Unban</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ban User Modal */}
      {banModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Ban {selectedUser.user?.firstName} {selectedUser.user?.lastName}?
            </h3>
            <p className="text-gray-600 mb-4">
              This user will be removed from the group and won't be able to rejoin.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Why are you banning this user?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows="3"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setBanModalOpen(false);
                  setSelectedUser(null);
                  setBanReason('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {processing ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageGroupMembers;
