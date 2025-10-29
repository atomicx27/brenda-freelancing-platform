import React, { useState } from 'react';
import { FaStar, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';

const ReviewForm = ({ 
  receiverId, 
  receiverName, 
  jobId, 
  jobTitle, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  existingReview = null 
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    if (comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters long';
    }
    if (comment.trim().length > 1000) {
      newErrors.comment = 'Comment must be less than 1000 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      receiverId,
      rating,
      comment: comment.trim(),
      jobId
    });
  };

  const handleRatingClick = (value) => {
    setRating(value);
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: null }));
    }
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
    if (errors.comment) {
      setErrors(prev => ({ ...prev, comment: null }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {existingReview ? 'Edit Review' : 'Write a Review'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <FaTimes className="w-6 h-6" />
        </button>
      </div>

      {/* Review Target Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {receiverName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{receiverName}</h3>
            {jobTitle && (
              <p className="text-sm text-gray-600">Job: {jobTitle}</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Overall Rating *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                disabled={isLoading}
              >
                <FaStar
                  className={`w-8 h-8 transition-colors ${
                    value <= (hoveredRating || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600">
              {rating > 0 && (
                <>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </>
              )}
            </span>
          </div>
          {errors.rating && (
            <div className="mt-2 flex items-center space-x-2 text-red-600">
              <FaExclamationTriangle className="w-4 h-4" />
              <span className="text-sm">{errors.rating}</span>
            </div>
          )}
        </div>

        {/* Comment Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Your Review *
          </label>
          <textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder="Share your experience working with this person. Be specific about what went well and what could be improved..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
              errors.comment ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={6}
            disabled={isLoading}
          />
          <div className="mt-2 flex justify-between items-center">
            <div>
              {errors.comment && (
                <div className="flex items-center space-x-2 text-red-600">
                  <FaExclamationTriangle className="w-4 h-4" />
                  <span className="text-sm">{errors.comment}</span>
                </div>
              )}
            </div>
            <span className={`text-sm ${comment.length > 1000 ? 'text-red-600' : 'text-gray-500'}`}>
              {comment.length}/1000
            </span>
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Review Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be honest and constructive in your feedback</li>
            <li>• Focus on the work quality, communication, and professionalism</li>
            <li>• Avoid personal attacks or inappropriate language</li>
            <li>• Your review will be visible to other users</li>
          </ul>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || rating === 0 || comment.trim().length < 10}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>{existingReview ? 'Updating...' : 'Submitting...'}</span>
              </>
            ) : (
              <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;


