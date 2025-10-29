import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import HeadTag from '../../components/HeadTag.jsx'
import Footer from '../../components/Footer.jsx'
import JobCard from '../../components/JobCard.jsx'
import apiService from '../../services/api'
import { FaSearch, FaFilter, FaPlus, FaSpinner } from 'react-icons/fa'

export default function AllJobs() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    isRemote: '',
    budgetMin: '',
    budgetMax: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadJobs()
    loadCategories()
  }, [filters, pagination.page])

  const loadJobs = async (retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      }
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })

      const response = await apiService.getAllJobs(params)
      setJobs(response.data.jobs)
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }))
    } catch (err) {
      // Retry logic for database/connection errors
      if (retryCount < 2 && (
        err.message?.includes('Database error') || 
        err.message?.includes('connection') ||
        err.message?.includes('500') ||
        err.message?.includes('Internal server error') ||
        err.message?.includes('timeout')
      )) {
        console.warn(`Retrying loadJobs (attempt ${retryCount + 1}/3)...`, err.message)
        setTimeout(() => loadJobs(retryCount + 1), 1000 * (retryCount + 1)) // Exponential backoff
        return
      }

      let errorMessage = 'Failed to load jobs'
      if (err.message?.includes('Database error') || err.message?.includes('connection')) {
        errorMessage = 'Database connection issue. Please try again in a moment.'
      } else if (err.message?.includes('Network Error') || err.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (err.message?.includes('500') || err.message?.includes('Internal server error')) {
        errorMessage = 'Server error. Please try again later.'
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      }
      setError(errorMessage)
      console.error('Error loading jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await apiService.getJobCategories()
      setCategories(response.data)
    } catch (err) {
      console.warn('Error loading categories:', err)
      // Don't show error for categories as it's not critical
      setCategories([])
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadJobs()
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      isRemote: '',
      budgetMin: '',
      budgetMax: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title="All Jobs - Brenda"/>
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Jobs</h1>
              <p className="text-gray-600 mt-2">Find your next project opportunity</p>
            </div>
            {isAuthenticated && user?.userType === 'CLIENT' && (
              <button
                onClick={() => navigate('/jobs/create')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
                Post a Job
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs by title or description..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat, index) => (
                      <option key={index} value={cat.category}>{cat.category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., New York"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remote</label>
                  <select
                    value={filters.isRemote}
                    onChange={(e) => handleFilterChange('isRemote', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Remote Only</option>
                    <option value="false">On-site Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-')
                      handleFilterChange('sortBy', sortBy)
                      handleFilterChange('sortOrder', sortOrder)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="budget-desc">Highest Budget</option>
                    <option value="budget-asc">Lowest Budget</option>
                  </select>
                </div>
              </div>

              {/* Budget Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.budgetMin}
                    onChange={(e) => handleFilterChange('budgetMin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget ($)</label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={filters.budgetMax}
                    onChange={(e) => handleFilterChange('budgetMax', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Clear Filters
                </button>
                <span className="text-sm text-gray-600">
                  {pagination.total} jobs found
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadJobs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No jobs found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-lg ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer/>
    </div>
  )
}



