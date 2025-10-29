import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MyReviews = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadReviews();
    } else {
      navigate('/account-security/login');
    }
  }, [isAuthenticated, pagination.page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      const response = await apiService.getUserAuthoredReviews(params);
      
      setReviews(response.data.reviews);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      setLoading(true);
      
      if (editingReview) {
        // Update existing review
        await apiService.updateReview(editingReview.id, reviewData);
        setSuccessMessage('Review updated successfully!');
      } else {
        // Create new review
        await apiService.createReview(reviewData);
        setSuccessMessage('Review submitted successfully!');
      }
      
      setShowReviewForm(false);
      setEditingReview(null);
      loadReviews(); // Reload reviews
    } catch (err) {
      setError(err.message || 'Failed to submit review');
      console.error('Error submitting review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteReview(reviewId);
      setSuccessMessage('Review deleted successfully!');
      loadReviews(); // Reload reviews
    } catch (err) {
      setError(err.message || 'Failed to delete review');
      console.error('Error deleting review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccessMessage(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your reviews.</p>
          <button
            onClick={() => navigate('/account-security/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (showReviewForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReviewForm
            receiverId={editingReview?.receiverId}
            receiverName={editingReview ? `${editingReview.receiver.firstName} ${editingReview.receiver.lastName}` : ''}
            jobId={editingReview?.jobId}
            jobTitle={editingReview?.job?.title}
            onSubmit={handleSubmitReview}
            onCancel={handleCancelReview}
            isLoading={loading}
            existingReview={editingReview}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-2">
            Manage the reviews you've written for other users
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6">
            <ErrorMessage error={error} onDismiss={clearError} />
          </div>
        )}

        {successMessage && (
          <div className="mb-6">
            <SuccessMessage message={successMessage} onDismiss={clearSuccess} />
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Reviews</h2>
              <p className="text-gray-600">
                {pagination.total} review{pagination.total !== 1 ? 's' : ''} written
              </p>
            </div>
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              <span>Write Review</span>
            </button>
          </div>
        </div>

        {/* Reviews List */}
        {loading && reviews.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading your reviews..." />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showActions={true}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                currentUserId={user?.id}
              />
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FaEdit className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't written any reviews yet. Start by reviewing users you've worked with.
            </p>
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <FaPlus className="w-4 h-4" />
              <span>Write Your First Review</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviews;
