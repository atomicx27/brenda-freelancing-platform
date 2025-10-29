import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import HeadTag from '../../components/HeadTag.jsx'
import Footer from '../../components/Footer.jsx'
import JobPostingForm from '../../components/JobPostingForm.jsx'
import apiService from '../../services/api'
import { FaArrowLeft, FaSpinner } from 'react-icons/fa'

export default function EditJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id && isAuthenticated && !authLoading) {
      loadJob()
    }
  }, [id, isAuthenticated, authLoading])

  const loadJob = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getJobById(id)
      const jobData = response.data
      
      // Check if user is the owner of the job
      if (jobData.ownerId !== user.id) {
        setError('You can only edit your own jobs')
        return
      }
      
      setJob(jobData)
    } catch (err) {
      setError(err.message || 'Failed to load job')
      console.error('Error loading job:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      console.log('Updating job data:', formData)
      
      const response = await apiService.updateJob(id, formData)
      
      if (response.success) {
        // Redirect to job details page
        navigate(`/jobs/${id}`)
      } else {
        setError(response.message || 'Failed to update job')
      }
    } catch (err) {
      setError(err.message || 'Failed to update job')
      console.error('Error updating job:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`/jobs/${id}`)
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to edit jobs.</p>
          <button
            onClick={() => navigate('/account-security/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Show loading while fetching job
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  // Show error if job couldn't be loaded or user doesn't have permission
  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Job not found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'The job you\'re trying to edit doesn\'t exist or has been removed.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/jobs/my-jobs')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              My Jobs
            </button>
            <button
              onClick={() => navigate('/jobs/all-jobs')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title={`Edit Job - ${job.title} - Brenda`}/>
      
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/jobs/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft />
            Back to Job Details
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
          <p className="text-gray-600 mt-2">Update your job posting details</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Edit Form */}
        <JobPostingForm
          job={job}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
      
      <Footer/>
    </div>
  )
}

