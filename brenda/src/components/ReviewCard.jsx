import React, { useState } from 'react';
import { FaStar, FaFlag, FaEdit, FaTrash, FaUser, FaBuilding } from 'react-icons/fa';
// Custom date formatting function to avoid date-fns dependency

const ReviewCard = ({ 
  review, 
  showActions = false, 
  onEdit = null, 
  onDelete = null, 
  onReport = null,
  currentUserId = null 
}) => {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const formatTimeAgo = (date) => {
    try {
      const now = new Date();
      const past = new Date(date);
      const diffInSeconds = Math.floor((now - past) / 1000);
      
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
      return `${Math.floor(diffInSeconds / 31536000)} years ago`;
    } catch (error) {
      return 'Recently';
    }
  };

  const handleReport = () => {
    if (onReport && reportReason && reportDescription.trim()) {
      onReport(review.id, {
        reason: reportReason,
        description: reportDescription.trim()
      });
      setShowReportForm(false);
      setReportReason('');
      setReportDescription('');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingText = (rating) => {
    const ratings = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratings[rating] || '';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {review.author.avatar ? (
              <img
                src={review.author.avatar}
                alt={review.author.firstName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-blue-600 font-semibold">
                {review.author.firstName?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">
                {review.author.firstName} {review.author.lastName}
              </h4>
              {review.author.company && (
                <div className="flex items-center space-x-1 text-gray-600">
                  <FaBuilding className="w-3 h-3" />
                  <span className="text-sm">{review.author.company.companyName}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {formatTimeAgo(review.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2">
            {currentUserId === review.authorId && onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit review"
              >
                <FaEdit className="w-4 h-4" />
              </button>
            )}
            {currentUserId === review.authorId && onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete review"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            )}
            {currentUserId !== review.authorId && onReport && (
              <button
                onClick={() => setShowReportForm(!showReportForm)}
                className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                title="Report review"
              >
                <FaFlag className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="flex items-center space-x-1">
          {renderStars(review.rating)}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {getRatingText(review.rating)}
        </span>
      </div>

      {/* Job Context */}
      {review.job && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Job:</span> {review.job.title}
          </p>
          {review.job.category && (
            <p className="text-sm text-gray-500">
              <span className="font-medium">Category:</span> {review.job.category}
            </p>
          )}
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>
      )}

      {/* Report Form */}
      {showReportForm && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h5 className="font-medium text-gray-900 mb-3">Report this review</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a reason</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="spam">Spam or fake review</option>
                <option value="harassment">Harassment or abuse</option>
                <option value="misleading">Misleading information</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide more details about why you're reporting this review..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReport}
                disabled={!reportReason || !reportDescription.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Submit Report
              </button>
              <button
                onClick={() => {
                  setShowReportForm(false);
                  setReportReason('');
                  setReportDescription('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
