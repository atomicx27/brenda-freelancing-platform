import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import HeadTag from '../../components/HeadTag.jsx'
import Footer from '../../components/Footer.jsx'
import JobCard from '../../components/JobCard.jsx'
import JobPostingForm from '../../components/JobPostingForm.jsx'
import apiService from '../../services/api'
import { FaPlus, FaSpinner, FaArrowLeft } from 'react-icons/fa'

export default function MyJobs() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  // Redirect if not authenticated or not a client
  React.useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return
    
    if (!isAuthenticated) {
      navigate('/account-security/login')
      return
    }
    if (user?.userType !== 'CLIENT') {
      navigate('/jobs/all-jobs')
      return
    }
  }, [isAuthenticated, user, navigate, authLoading])

  useEffect(() => {
    if (isAuthenticated && user?.userType === 'CLIENT') {
      loadJobs()
    }
  }, [isAuthenticated, user, statusFilter])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const params = statusFilter ? { status: statusFilter } : {}
      const response = await apiService.getUserJobs(params)
      setJobs(response.data.jobs)
    } catch (err) {
      setError('Failed to load your jobs')
      console.error('Error loading jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = () => {
    setEditingJob(null)
    setShowForm(true)
  }

  const handleEditJob = (job) => {
    navigate(`/jobs/edit/${job.id}`)
  }

  const handleViewJob = (job) => {
    navigate(`/jobs/${job.id}`)
  }

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      await apiService.deleteJob(job.id)
      setJobs(prev => prev.filter(j => j.id !== job.id))
    } catch (err) {
      setError('Failed to delete job')
      console.error('Error deleting job:', err)
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      let response
      if (editingJob) {
        response = await apiService.updateJob(editingJob.id, formData)
        setJobs(prev => prev.map(job => 
          job.id === editingJob.id ? response.data : job
        ))
      } else {
        response = await apiService.createJob(formData)
        setJobs(prev => [response.data, ...prev])
      }
      
      setShowForm(false)
      setEditingJob(null)
    } catch (err) {
      setError(err.message || 'Failed to save job')
      console.error('Error saving job:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingJob(null)
  }

  const getStatusCounts = () => {
    const counts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0
    }
    
    jobs.forEach(job => {
      counts[job.status] = (counts[job.status] || 0) + 1
    })
    
    return counts
  }

  if (!isAuthenticated || user?.userType !== 'CLIENT') {
    return null
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title="My Jobs - Brenda"/>
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/jobs/all-jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <FaArrowLeft />
            Back to All Jobs
          </button>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Job Postings</h1>
              <p className="text-gray-600 mt-2">Manage your posted jobs and track applications</p>
            </div>
            <button
              onClick={handleCreateJob}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              Post New Job
            </button>
          </div>

          {/* Status Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">{statusCounts.OPEN}</div>
              <div className="text-sm text-gray-600">Open Jobs</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.IN_PROGRESS}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-600">{statusCounts.COMPLETED}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-red-600">{statusCounts.CANCELLED}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Jobs</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Job Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <JobPostingForm
                job={editingJob}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your jobs...</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                {statusFilter 
                  ? `No jobs found with status "${statusFilter}"`
                  : "You haven't posted any jobs yet. Create your first job posting to get started!"
                }
              </p>
              {!statusFilter && (
                <button
                  onClick={handleCreateJob}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <FaPlus />
                  Post Your First Job
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showActions={true}
                onEdit={handleEditJob}
                onDelete={handleDeleteJob}
                onView={handleViewJob}
              />
            ))}
          </div>
        )}
      </div>
      
      <Footer/>
    </div>
  )
}
