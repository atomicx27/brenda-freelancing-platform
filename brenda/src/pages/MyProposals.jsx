import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import HeadTag from '../components/HeadTag.jsx'
import Footer from '../components/Footer.jsx'
import ProposalCard from '../components/ProposalCard.jsx'
import apiService from '../services/api'
import { FaSpinner, FaPaperPlane, FaFilter, FaSearch } from 'react-icons/fa'

export default function MyProposals() {
  const { user, isAuthenticated, isFreelancer } = useAuth()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })
  const [stats, setStats] = useState({
    totalProposals: 0,
    averageRate: 0,
    statusBreakdown: {}
  })

  useEffect(() => {
    if (isAuthenticated && isFreelancer) {
      loadProposals()
      loadStats()
    } else if (isAuthenticated && !isFreelancer) {
      setError('You must be a freelancer to view proposals.')
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, isFreelancer, pagination.page, filters])

  const loadProposals = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined
      }
      const response = await apiService.getUserProposals(params)
      setProposals(response.data.proposals)
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }))
    } catch (err) {
      setError(err.message || 'Failed to load proposals')
      console.error('Error loading proposals:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiService.getProposalStats()
      setStats(response.data)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // For now, we'll just reload with current filters
    // In a real app, you'd implement search on the backend
    loadProposals()
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      search: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleDeleteProposal = async (proposalId) => {
    if (!window.confirm('Are you sure you want to withdraw this proposal?')) {
      return
    }
    
    try {
      await apiService.deleteProposal(proposalId)
      setProposals(prev => prev.filter(p => p.id !== proposalId))
      loadStats() // Refresh stats
    } catch (err) {
      alert(err.message || 'Failed to withdraw proposal')
      console.error('Error deleting proposal:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600'
      case 'ACCEPTED':
        return 'text-green-600'
      case 'REJECTED':
        return 'text-red-600'
      case 'WITHDRAWN':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!isAuthenticated || !isFreelancer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{error || 'You must be logged in as a freelancer to view this page.'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title="My Proposals - Brenda" />

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaPaperPlane className="text-blue-600" />
            My Proposals
          </h1>
          <p className="text-gray-600 mt-2">Track and manage your job applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalProposals}</div>
            <div className="text-sm text-gray-600">Total Proposals</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.statusBreakdown.ACCEPTED || 0}
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.statusBreakdown.PENDING || 0}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-purple-600">
              ${stats.averageRate ? Math.round(stats.averageRate) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg. Rate</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search by job title or company..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
            
            <div className="flex gap-4">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
              
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your proposals...</p>
            </div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <FaPaperPlane className="text-6xl text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No proposals yet</h3>
              <p className="text-gray-600 mb-6">
                Start applying to jobs to see your proposals here.
              </p>
              <button
                onClick={() => window.location.href = '/jobs/all-jobs'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Jobs
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  showJobInfo={true}
                  showActions={true}
                  onDelete={handleDeleteProposal}
                />
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

      <Footer />
    </div>
  )
}

