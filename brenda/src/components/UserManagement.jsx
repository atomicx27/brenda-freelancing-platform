import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaEdit, 
  FaBan, 
  FaCheck, 
  FaTimes, 
  FaUserCheck,
  FaUserTimes,
  FaSpinner,
  FaDownload,
  FaUpload
} from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    userType: '',
    isVerified: '',
    isActive: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadUsers();
  }, [filters, pagination.page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await apiService.getAllUsers(params);
      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action, reason = '') => {
    try {
      await apiService.updateUserStatus(userId, action, reason);
      loadUsers(); // Refresh users list
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      userType: '',
      isVerified: '',
      isActive: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await apiService.getUserDetails(userId);
      setSelectedUser(response.data);
      setShowUserModal(true);
    } catch (err) {
      console.error('Error loading user details:', err);
      alert('Failed to load user details');
    }
  };

  const exportUsers = () => {
    // In a real application, this would generate and download a CSV/Excel file
    const csvContent = [
      ['Name', 'Email', 'Type', 'Status', 'Verified', 'Created At'],
      ...users.map(user => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.userType,
        user.isActive ? 'Active' : 'Inactive',
        user.profile?.isVerified ? 'Yes' : 'No',
        new Date(user.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const UserModal = () => {
    if (!selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                User Details: {selectedUser.firstName} {selectedUser.lastName}
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User Type</label>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      selectedUser.userType === 'FREELANCER' ? 'bg-blue-100 text-blue-800' :
                      selectedUser.userType === 'CLIENT' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedUser.userType}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Verified</label>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      selectedUser.profile?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedUser.profile?.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              {selectedUser.profile && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-gray-900">{selectedUser.profile.title || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company</label>
                      <p className="text-gray-900">{selectedUser.profile.company || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Experience</label>
                      <p className="text-gray-900">{selectedUser.profile.experience || 'Not specified'} years</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
                      <p className="text-gray-900">${selectedUser.profile.hourlyRate || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-600">Jobs</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedUser._count?.jobs || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-600">Proposals</p>
                    <p className="text-2xl font-bold text-green-900">{selectedUser._count?.proposals || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-600">Reviews</p>
                    <p className="text-2xl font-bold text-yellow-900">{selectedUser._count?.reviews || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-600">Messages</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {(selectedUser._count?.sentMessages || 0) + (selectedUser._count?.receivedMessages || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleUserAction(selectedUser.id, selectedUser.isActive ? 'ban' : 'unban')}
                    className={`w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                      selectedUser.isActive 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedUser.isActive ? <FaBan /> : <FaUserCheck />}
                    <span>{selectedUser.isActive ? 'Ban User' : 'Unban User'}</span>
                  </button>
                  
                  <button
                    onClick={() => handleUserAction(selectedUser.id, selectedUser.profile?.isVerified ? 'unverify' : 'verify')}
                    className={`w-full px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                      selectedUser.profile?.isVerified 
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedUser.profile?.isVerified ? <FaUserTimes /> : <FaUserCheck />}
                    <span>{selectedUser.profile?.isVerified ? 'Remove Verification' : 'Verify User'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
            <select
              value={filters.userType}
              onChange={(e) => handleFilterChange('userType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification</label>
            <select
              value={filters.isVerified}
              onChange={(e) => handleFilterChange('isVerified', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
          >
            <FaFilter />
            <span>Clear Filters</span>
          </button>

          <button
            onClick={exportUsers}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <FaDownload />
            <span>Export Users</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Users ({pagination.total})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-2xl text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.userType === 'FREELANCER' ? 'bg-blue-100 text-blue-800' :
                          user.userType === 'CLIENT' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {user.userType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.profile?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.profile?.isVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewUserDetails(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, user.isActive ? 'ban' : 'unban')}
                            className={user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                            title={user.isActive ? "Ban User" : "Unban User"}
                          >
                            {user.isActive ? <FaBan /> : <FaCheck />}
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, user.profile?.isVerified ? 'unverify' : 'verify')}
                            className={user.profile?.isVerified ? "text-yellow-600 hover:text-yellow-900" : "text-blue-600 hover:text-blue-900"}
                            title={user.profile?.isVerified ? "Remove Verification" : "Verify User"}
                          >
                            {user.profile?.isVerified ? <FaUserTimes /> : <FaUserCheck />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded-md text-sm ${
                            pagination.page === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && <UserModal />}
    </div>
  );
};

export default UserManagement;


