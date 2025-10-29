import React from 'react'
import { Link } from 'react-router-dom'
import { FaUser, FaDollarSign, FaClock, FaCalendarAlt, FaEye, FaEdit, FaTrash } from 'react-icons/fa'

const ProposalCard = ({ 
  proposal, 
  showJobInfo = false, 
  showActions = false, 
  onEdit = null, 
  onDelete = null,
  onView = null 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatRate = (rate, budgetType) => {
    if (!rate) return 'Rate not specified'
    
    const formattedRate = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rate)

    return budgetType === 'HOURLY' ? `${formattedRate}/hr` : formattedRate
  }

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {proposal.author?.avatar ? (
            <img
              src={`http://localhost:5000${proposal.author.avatar}`}
              alt={proposal.author.firstName}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <FaUser className="text-gray-500" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {proposal.author?.firstName} {proposal.author?.lastName}
            </h3>
            <p className="text-sm text-gray-600">
              {proposal.author?.profile?.title || 'Freelancer'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
            {proposal.status}
          </span>
          {showActions && (
            <div className="flex gap-1">
              {onView && (
                <button
                  onClick={() => onView(proposal)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="View Details"
                >
                  <FaEye />
                </button>
              )}
              {onEdit && proposal.status === 'PENDING' && (
                <button
                  onClick={() => onEdit(proposal)}
                  className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                  title="Edit Proposal"
                >
                  <FaEdit />
                </button>
              )}
              {onDelete && proposal.status !== 'ACCEPTED' && (
                <button
                  onClick={() => onDelete(proposal)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete Proposal"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Job Info (if showing) */}
      {showJobInfo && proposal.job && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h4 className="font-medium text-gray-900 mb-1">
            <Link 
              to={`/jobs/${proposal.job.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              {proposal.job.title}
            </Link>
          </h4>
          <p className="text-sm text-gray-600">
            {proposal.job.owner?.company?.companyName || `${proposal.job.owner?.firstName} ${proposal.job.owner?.lastName}`}
          </p>
        </div>
      )}

      {/* Cover Letter Preview */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed">
          {truncateText(proposal.coverLetter)}
        </p>
      </div>

      {/* Proposal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {proposal.proposedRate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaDollarSign className="text-xs" />
            <span>
              {formatRate(proposal.proposedRate, proposal.job?.budgetType)}
            </span>
          </div>
        )}
        
        {proposal.estimatedDuration && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaClock className="text-xs" />
            <span>{proposal.estimatedDuration}</span>
          </div>
        )}
      </div>

      {/* Skills */}
      {proposal.author?.profile?.skills && proposal.author.profile.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {proposal.author.profile.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {proposal.author.profile.skills.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{proposal.author.profile.skills.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-xs" />
          <span>Submitted {formatTimeAgo(proposal.createdAt)}</span>
        </div>
        
        {showJobInfo && proposal.job && (
          <Link
            to={`/jobs/${proposal.job.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            View Job
          </Link>
        )}
      </div>
    </div>
  )
}

export default ProposalCard
