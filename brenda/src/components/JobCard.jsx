import React from 'react'
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaUser, FaCalendarAlt, FaLaptop, FaEye } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import MatchBadge from './MatchBadge.jsx'

const JobCard = ({ job, showActions = false, onEdit, onDelete, onView }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatBudget = (budget, budgetType) => {
    if (!budget) return 'Budget not specified'
    
    const formattedBudget = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(budget)

    switch (budgetType) {
      case 'HOURLY':
        return `${formattedBudget}/hour`
      case 'RANGE':
        return `${formattedBudget} range`
      default:
        return formattedBudget
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {job.title}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
              {job.status.replace('_', ' ')}
            </span>
          </div>
          
          {/* Company Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <FaUser className="text-xs" />
            <span>
              {job.owner?.company?.companyName || `${job.owner?.firstName} ${job.owner?.lastName}`}
            </span>
          </div>
        </div>
        
        {(job.matchAnalysis || job.owner?.company?.logo) && (
          <div className="flex flex-col items-end gap-3 min-w-[110px]">
            <MatchBadge match={job.matchAnalysis} className="hidden sm:block" />
            {job.owner?.company?.logo && (
              <img
                src={job.owner.company.logo}
                alt="Company logo"
                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
              />
            )}
            <MatchBadge match={job.matchAnalysis} className="sm:hidden" />
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-700 text-sm mb-4 line-clamp-3">
        {job.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-4">
        {job.skills.slice(0, 5).map((skill, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
          >
            {skill}
          </span>
        ))}
        {job.skills.length > 5 && (
          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
            +{job.skills.length - 5} more
          </span>
        )}
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {/* Budget */}
        <div className="flex items-center gap-2 text-gray-600">
          <FaDollarSign className="text-xs" />
          <span>{formatBudget(job.budget, job.budgetType)}</span>
        </div>

        {/* Duration */}
        {job.duration && (
          <div className="flex items-center gap-2 text-gray-600">
            <FaClock className="text-xs" />
            <span>{job.duration}</span>
          </div>
        )}

        {/* Location */}
        {job.location && (
          <div className="flex items-center gap-2 text-gray-600">
            <FaMapMarkerAlt className="text-xs" />
            <span>{job.location}</span>
          </div>
        )}

        {/* Remote */}
        {job.isRemote && (
          <div className="flex items-center gap-2 text-gray-600">
            <FaLaptop className="text-xs" />
            <span>Remote</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <FaCalendarAlt />
            <span>Posted {formatDate(job.createdAt)}</span>
          </div>
          {job._count?.proposals > 0 && (
            <span>{job._count.proposals} proposals</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showActions ? (
            <>
              <button
                onClick={() => onView && onView(job)}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <FaEye className="inline mr-1" />
                View
              </button>
              <button
                onClick={() => onEdit && onEdit(job)}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete && onDelete(job)}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <Link
              to={`/jobs/${job.id}`}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobCard

