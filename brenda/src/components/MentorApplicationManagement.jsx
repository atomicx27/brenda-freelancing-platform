import React, { useState, useEffect } from 'react';
import {
  FaGraduationCap,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUser,
  FaEnvelope,
  FaBriefcase,
  FaCalendar,
  FaLinkedin,
  FaGlobe,
  FaTrophy,
  FaFilter,
  FaSearch,
  FaEye,
  FaSpinner,
  FaStar
} from 'react-icons/fa';
import apiService from '../services/api';

const MentorApplicationManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadApplications();
  }, [statusFilter, pagination.page]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllMentorApplications({
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        order: 'desc'
      });

      setApplications(response.data.applications || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Failed to load applications:', error);
      alert('Failed to load mentor applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleActionClick = (application, type) => {
    setSelectedApplication(application);
    setActionType(type);
    setAdminNotes('');
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedApplication) return;

    if (actionType === 'reject' && (!adminNotes || adminNotes.trim().length < 10)) {
      alert('Please provide a reason for rejection (minimum 10 characters)');
      return;
    }

    try {
      setActionLoading(true);
      
      if (actionType === 'approve') {
        await apiService.approveMentorApplication(selectedApplication.id, adminNotes);
        alert('Application approved successfully!');
      } else {
        await apiService.rejectMentorApplication(selectedApplication.id, adminNotes);
        alert('Application rejected');
      }

      setShowActionModal(false);
      setSelectedApplication(null);
      setAdminNotes('');
      await loadApplications();
    } catch (error) {
      console.error('Action failed:', error);
      alert(error?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: FaClock,
        label: 'Pending Review'
      },
      APPROVED: {
        color: 'bg-green-100 text-green-800',
        icon: FaCheckCircle,
        label: 'Approved'
      },
      REJECTED: {
        color: 'bg-red-100 text-red-800',
        icon: FaTimesCircle,
        label: 'Rejected'
      }
    };

    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' ||
      `${app.user?.firstName} ${app.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.expertise?.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaGraduationCap className="text-3xl text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Mentor Applications</h2>
            <p className="text-sm text-gray-600">Review and approve mentor applications</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Applications</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">
                {applications.filter(a => a.status === 'PENDING').length}
              </p>
            </div>
            <FaClock className="text-3xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-900">
                {applications.filter(a => a.status === 'APPROVED').length}
              </p>
            </div>
            <FaCheckCircle className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Rejected</p>
              <p className="text-2xl font-bold text-red-900">
                {applications.filter(a => a.status === 'REJECTED').length}
              </p>
            </div>
            <FaTimesCircle className="text-3xl text-red-500" />
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-4xl text-purple-600" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <FaGraduationCap className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-600">No applications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* User Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    {application.user?.avatar ? (
                      <img
                        src={application.user.avatar}
                        alt={`${application.user.firstName} ${application.user.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                        <FaUser className="text-2xl text-purple-600" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {application.user?.firstName} {application.user?.lastName}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <FaEnvelope className="w-4 h-4" />
                          <span>{application.user?.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaBriefcase className="w-4 h-4" />
                          <span>{application.experience} years of experience</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaCalendar className="w-4 h-4" />
                          <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Expertise Tags */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {application.expertise?.slice(0, 3).map((exp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                          >
                            {exp}
                          </span>
                        ))}
                        {application.expertise?.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{application.expertise.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Motivation Preview */}
                      {application.motivation && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2 italic">
                          "{application.motivation}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <FaEye />
                      <span>View Details</span>
                    </button>

                    {application.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleActionClick(application, 'approve')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <FaCheckCircle />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleActionClick(application, 'reject')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                        >
                          <FaTimesCircle />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-2xl font-bold">Application Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Applicant Info */}
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
                {selectedApplication.user?.avatar ? (
                  <img
                    src={selectedApplication.user.avatar}
                    alt={`${selectedApplication.user.firstName} ${selectedApplication.user.lastName}`}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                    <FaUser className="text-3xl text-purple-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedApplication.user?.firstName} {selectedApplication.user?.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedApplication.user?.email}</p>
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </div>

              <div className="space-y-6">
                {/* Experience */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                    <FaBriefcase className="text-purple-600" />
                    <span>Professional Experience</span>
                  </h4>
                  <p className="text-gray-700">
                    <strong>{selectedApplication.experience} years</strong> of professional experience
                  </p>
                </div>

                {/* Expertise */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                    <FaStar className="text-purple-600" />
                    <span>Areas of Expertise</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.expertise?.map((exp, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                    <FaClock className="text-purple-600" />
                    <span>Availability</span>
                  </h4>
                  <p className="text-gray-700">{selectedApplication.availability}</p>
                </div>

                {/* Motivation */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Motivation</h4>
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.motivation}</p>
                  </div>
                </div>

                {/* Achievements */}
                {selectedApplication.achievements && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                      <FaTrophy className="text-purple-600" />
                      <span>Notable Achievements</span>
                    </h4>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.achievements}</p>
                    </div>
                  </div>
                )}

                {/* Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedApplication.linkedinUrl && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">LinkedIn Profile</h4>
                      <a
                        href={selectedApplication.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <FaLinkedin />
                        <span className="truncate">View Profile</span>
                      </a>
                    </div>
                  )}
                  {selectedApplication.portfolioUrl && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Portfolio/Website</h4>
                      <a
                        href={selectedApplication.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <FaGlobe />
                        <span className="truncate">Visit Website</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Review Info */}
                {selectedApplication.reviewedAt && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Review Information</h4>
                    <p className="text-sm text-gray-600">
                      Reviewed on {new Date(selectedApplication.reviewedAt).toLocaleString()}
                    </p>
                    {selectedApplication.adminNotes && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
                        <p className="text-gray-600 mt-1">{selectedApplication.adminNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              {selectedApplication.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleActionClick(selectedApplication, 'approve');
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleActionClick(selectedApplication, 'reject');
                    }}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
            <div className={`px-6 py-4 rounded-t-lg ${
              actionType === 'approve' ? 'bg-green-600' : 'bg-red-600'
            }`}>
              <h3 className="text-xl font-bold text-white">
                {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
              </h3>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to <strong>{actionType}</strong> the application from{' '}
                <strong>{selectedApplication.user?.firstName} {selectedApplication.user?.lastName}</strong>?
              </p>

              {actionType === 'approve' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this approval..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows="3"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Please provide a reason for rejection (minimum 10 characters)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    rows="4"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {adminNotes.length} / 10 characters
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setActionType(null);
                  setAdminNotes('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{actionType === 'approve' ? 'Approve' : 'Reject'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorApplicationManagement;
