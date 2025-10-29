import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { 
  FaSearch, 
  FaFilter, 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaFlag,
  FaSpinner,
  FaStar,
  FaBriefcase,
  FaUser,
  FaComments,
  FaExclamationTriangle
} from 'react-icons/fa';

const ContentModeration = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [activeType, setActiveType] = useState('reviews');
  const [filters, setFilters] = useState({
    status: 'pending',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadContent();
  }, [activeType, filters, pagination.page]);

  const loadContent = async () => {
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

      const response = await apiService.getContentForModeration(activeType, params);
      setContent(response.data.content);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (err) {
      setError('Failed to load content');
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateContent = async (contentId, action, reason = '') => {
    try {
      await apiService.moderateContent(contentId, activeType, action, reason);
      loadContent(); // Refresh content list
    } catch (err) {
      console.error('Error moderating content:', err);
      alert('Failed to moderate content');
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
      status: 'pending',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const viewContentDetails = (item) => {
    setSelectedContent(item);
    setShowContentModal(true);
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'reviews': return FaStar;
      case 'jobs': return FaBriefcase;
      case 'profiles': return FaUser;
      default: return FaComments;
    }
  };

  const getContentTitle = (item) => {
    switch (activeType) {
      case 'reviews':
        return `Review by ${item.author?.firstName} ${item.author?.lastName}`;
      case 'jobs':
        return item.title;
      case 'profiles':
        return `${item.firstName} ${item.lastName}`;
      default:
        return 'Unknown Content';
    }
  };

  const getContentDescription = (item) => {
    switch (activeType) {
      case 'reviews':
        return item.comment || 'No comment provided';
      case 'jobs':
        return item.description || 'No description provided';
      case 'profiles':
        return item.email || 'No email provided';
      default:
        return 'No description available';
    }
  };

  const ContentModal = () => {
    if (!selectedContent) return null;

    const ContentIcon = getContentIcon(activeType);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <ContentIcon className="text-2xl text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {getContentTitle(selectedContent)}
                </h2>
              </div>
              <button
                onClick={() => setShowContentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Content Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Details</h3>
                <div className="space-y-3">
                  {activeType === 'reviews' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Rating</label>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`text-lg ${
                                i < selectedContent.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            ({selectedContent.rating}/5)
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Comment</label>
                        <p className="text-gray-900 bg-white p-3 rounded border">
                          {selectedContent.comment || 'No comment provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Author</label>
                        <p className="text-gray-900">
                          {selectedContent.author?.firstName} {selectedContent.author?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{selectedContent.author?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Receiver</label>
                        <p className="text-gray-900">
                          {selectedContent.receiver?.firstName} {selectedContent.receiver?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{selectedContent.receiver?.email}</p>
                      </div>
                    </>
                  )}

                  {activeType === 'jobs' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Title</label>
                        <p className="text-gray-900">{selectedContent.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-gray-900 bg-white p-3 rounded border">
                          {selectedContent.description}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Budget</label>
                        <p className="text-gray-900">${selectedContent.budget || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-gray-900">{selectedContent.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Owner</label>
                        <p className="text-gray-900">
                          {selectedContent.owner?.firstName} {selectedContent.owner?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{selectedContent.owner?.email}</p>
                      </div>
                    </>
                  )}

                  {activeType === 'profiles' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-gray-900">
                          {selectedContent.firstName} {selectedContent.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedContent.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">User Type</label>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          selectedContent.userType === 'FREELANCER' ? 'bg-blue-100 text-blue-800' :
                          selectedContent.userType === 'CLIENT' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {selectedContent.userType}
                        </span>
                      </div>
                      {selectedContent.profile && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Title</label>
                            <p className="text-gray-900">{selectedContent.profile.title || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Company</label>
                            <p className="text-gray-900">{selectedContent.profile.company || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Experience</label>
                            <p className="text-gray-900">{selectedContent.profile.experience || 'Not specified'} years</p>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-gray-900">
                      {new Date(selectedContent.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Moderation Actions */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Moderation Actions</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      handleModerateContent(selectedContent.id, 'approve');
                      setShowContentModal(false);
                    }}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <FaCheck />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Please provide a reason for rejection:');
                      if (reason) {
                        handleModerateContent(selectedContent.id, 'reject', reason);
                        setShowContentModal(false);
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <FaTimes />
                    <span>Reject</span>
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
      {/* Content Type Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { id: 'reviews', label: 'Reviews', icon: FaStar },
              { id: 'jobs', label: 'Jobs', icon: FaBriefcase },
              { id: 'profiles', label: 'Profiles', icon: FaUser }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveType(tab.id);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm ${
                  activeType === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
              >
                <FaFilter />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {activeType.charAt(0).toUpperCase() + activeType.slice(1)} for Moderation ({pagination.total})
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
        ) : content.length === 0 ? (
          <div className="text-center py-12">
            <FaExclamationTriangle className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">No content found for moderation</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {content.map((item) => {
                const ContentIcon = getContentIcon(activeType);
                return (
                  <div key={item.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <ContentIcon className="text-2xl text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-medium text-gray-900 truncate">
                            {getContentTitle(item)}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {getContentDescription(item)}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              Created: {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            {activeType === 'reviews' && (
                              <div className="flex items-center space-x-1">
                                <FaStar className="text-yellow-400" />
                                <span>{item.rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewContentDetails(item)}
                          className="text-blue-600 hover:text-blue-900 p-2"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleModerateContent(item.id, 'approve')}
                          className="text-green-600 hover:text-green-900 p-2"
                          title="Approve"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Please provide a reason for rejection:');
                            if (reason) {
                              handleModerateContent(item.id, 'reject', reason);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-2"
                          title="Reject"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Content Details Modal */}
      {showContentModal && <ContentModal />}
    </div>
  );
};

export default ContentModeration;


