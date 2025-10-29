import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDollarSign, FaBriefcase, FaStar, FaChartLine, FaCalendarAlt, FaTrophy, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import AnalyticsChart from '../components/AnalyticsChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const FreelancerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    if (isAuthenticated && user?.userType === 'FREELANCER') {
      loadAnalytics();
    } else if (isAuthenticated && user?.userType !== 'FREELANCER') {
      navigate('/dashboard/client');
    } else {
      navigate('/account-security/login');
    }
  }, [isAuthenticated, user, period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getFreelancerAnalytics({ period });
      setAnalytics(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage error={error} onDismiss={() => setError(null)} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Data Available</h2>
          <p className="text-gray-600 mb-6">Start applying to jobs to see your analytics.</p>
          <button
            onClick={() => navigate('/jobs/all-jobs')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Freelancer Dashboard</h1>
              <p className="text-gray-600 mt-2">Track your performance and earnings</p>
            </div>
            
            {/* Period Selector */}
            <div className="flex space-x-2">
              {['7d', '30d', '90d', '1y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '1 Year'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsChart
            type="metric"
            data={{
              value: formatCurrency(analytics.overview.totalEarnings),
              label: 'Total Earnings'
            }}
            title="Total Earnings"
            showTrend={true}
            trendValue={12.5}
            trendLabel="vs last period"
          />
          
          <AnalyticsChart
            type="metric"
            data={{
              value: analytics.overview.acceptedJobs,
              label: 'Accepted Jobs'
            }}
            title="Accepted Jobs"
            showTrend={true}
            trendValue={8.2}
            trendLabel="vs last period"
          />
          
          <AnalyticsChart
            type="metric"
            data={{
              value: analytics.overview.averageRating.toFixed(1),
              label: 'Average Rating'
            }}
            title="Average Rating"
            showTrend={true}
            trendValue={5.1}
            trendLabel="vs last period"
          />
          
          <AnalyticsChart
            type="metric"
            data={{
              value: formatPercentage(analytics.performance.acceptanceRate),
              label: 'Acceptance Rate'
            }}
            title="Acceptance Rate"
            showTrend={true}
            trendValue={-2.3}
            trendLabel="vs last period"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Earnings Trend */}
          <AnalyticsChart
            type="line"
            data={analytics.earnings.monthlyTrend.map(item => ({
              label: item.month.slice(5), // Show only month
              value: item.earnings
            }))}
            title="Earnings Trend"
            subtitle={`${period} period`}
            height={300}
          />

          {/* Category Performance */}
          <AnalyticsChart
            type="bar"
            data={analytics.performance.topCategories.map(cat => ({
              name: cat.category,
              value: cat.jobs
            }))}
            title="Top Categories"
            subtitle="Jobs by category"
            height={300}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaBriefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{activity.jobTitle}</h4>
                        <p className="text-sm text-gray-600">{activity.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(activity.proposedRate)}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activity.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average per job</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(analytics.earnings.averagePerJob)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total proposals</span>
                  <span className="font-medium text-gray-900">
                    {analytics.overview.totalProposals}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total reviews</span>
                  <span className="font-medium text-gray-900">
                    {analytics.overview.totalReviews}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/jobs/all-jobs')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaBriefcase className="w-4 h-4" />
                  <span>Browse Jobs</span>
                </button>
                <button
                  onClick={() => navigate('/proposals')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaChartLine className="w-4 h-4" />
                  <span>My Proposals</span>
                </button>
                <button
                  onClick={() => navigate('/reviews/my-reviews')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaStar className="w-4 h-4" />
                  <span>My Reviews</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerDashboard;


