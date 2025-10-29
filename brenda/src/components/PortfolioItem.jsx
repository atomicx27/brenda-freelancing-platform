import React, { useState } from 'react'
import { FaExternalLinkAlt, FaGithub, FaEdit, FaTrash, FaEye, FaEyeSlash, FaStar, FaCalendarAlt, FaTag } from 'react-icons/fa'

const PortfolioItem = ({ 
  item, 
  onEdit, 
  onDelete, 
  onToggleFeatured, 
  onToggleVisibility,
  isOwner = false 
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${
      item.featured ? 'ring-2 ring-yellow-400' : ''
    }`}>
      {/* Image Section */}
      {item.images && item.images.length > 0 && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={`http://localhost:5000${item.images[0]}`}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {item.featured && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
              <FaStar className="text-xs" />
              <span>Featured</span>
            </div>
          )}
          {!item.isPublic && (
            <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
              <FaEyeSlash className="text-xs" />
              <span>Private</span>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {item.title}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {item.category}
              </span>
              {item.startDate && (
                <div className="flex items-center space-x-1">
                  <FaCalendarAlt className="text-xs" />
                  <span>{formatDate(item.startDate)}</span>
                  {item.endDate && <span>- {formatDate(item.endDate)}</span>}
                </div>
              )}
            </div>
          </div>
          
          {isOwner && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onToggleFeatured(item.id)}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  item.featured 
                    ? 'text-yellow-500 hover:text-yellow-600' 
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
                title={item.featured ? 'Remove from featured' : 'Add to featured'}
              >
                <FaStar className="text-sm" />
              </button>
              <button
                onClick={() => onToggleVisibility(item.id)}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  item.isPublic 
                    ? 'text-green-500 hover:text-green-600' 
                    : 'text-gray-400 hover:text-green-500'
                }`}
                title={item.isPublic ? 'Make private' : 'Make public'}
              >
                {item.isPublic ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
              </button>
              <button
                onClick={() => onEdit(item)}
                className="p-2 text-blue-500 hover:text-blue-600 rounded-full transition-colors duration-200"
                title="Edit portfolio item"
              >
                <FaEdit className="text-sm" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-2 text-red-500 hover:text-red-600 rounded-full transition-colors duration-200"
                title="Delete portfolio item"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <div className="mb-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {showFullDescription ? item.description : truncateText(item.description)}
            </p>
            {item.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Technologies */}
        {item.technologies && item.technologies.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {item.technologies.map((tech, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  <FaTag className="mr-1 text-xs" />
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex items-center space-x-4">
          {item.liveUrl && (
            <a
              href={item.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
            >
              <FaExternalLinkAlt className="text-xs" />
              <span>Live Demo</span>
            </a>
          )}
          {item.githubUrl && (
            <a
              href={item.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200"
            >
              <FaGithub className="text-xs" />
              <span>GitHub</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default PortfolioItem
