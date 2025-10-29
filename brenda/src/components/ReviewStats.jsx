import React from 'react';
import { FaStar, FaChartBar } from 'react-icons/fa';

const ReviewStats = ({ stats, showDetails = true }) => {
  if (!stats) return null;

  const { averageRating, totalReviews, ratingDistribution } = stats;

  const getRatingPercentage = (rating) => {
    if (totalReviews === 0) return 0;
    return Math.round((ratingDistribution[rating] / totalReviews) * 100);
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        className={`${size} ${
          index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingText = (rating) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Very Good';
    if (rating >= 2.5) return 'Good';
    if (rating >= 1.5) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FaChartBar className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Review Statistics</h3>
      </div>

      {/* Overall Rating */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {renderStars(averageRating, 'w-6 h-6')}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {averageRating ? averageRating.toFixed(1) : '0.0'}
        </div>
        <div className="text-sm text-gray-600">
          {getRatingText(averageRating)} • {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </div>
      </div>

      {showDetails && (
        <>
          {/* Rating Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Rating Breakdown</h4>
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-16">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <FaStar className="w-3 h-3 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getRatingPercentage(rating)}%` }}
                  />
                </div>
                <div className="w-12 text-right">
                  <span className="text-sm text-gray-600">
                    {ratingDistribution[rating] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((ratingDistribution[5] + ratingDistribution[4]) / totalReviews * 100) || 0}%
                </div>
                <div className="text-sm text-gray-600">Positive</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {Math.round((ratingDistribution[1] + ratingDistribution[2]) / totalReviews * 100) || 0}%
                </div>
                <div className="text-sm text-gray-600">Negative</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewStats;


