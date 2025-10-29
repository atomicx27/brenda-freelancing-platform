import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import HeadTag from '../../components/HeadTag.jsx'
import Footer from '../../components/Footer.jsx'
import JobPostingForm from '../../components/JobPostingForm.jsx'
import apiService from '../../services/api'
import { FaArrowLeft } from 'react-icons/fa'

export default function CreateJob() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

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

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Debug: Log the data being sent
      console.log('Submitting job data:', formData)
      
      const response = await apiService.createJob(formData)
      
      // Redirect to job details page
      navigate(`/jobs/${response.data.id}`)
    } catch (err) {
      setError(err.message || 'Failed to create job')
      console.error('Error creating job:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/jobs/all-jobs')
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

  if (!isAuthenticated || user?.userType !== 'CLIENT') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title="Create Job - Brenda"/>
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/jobs/all-jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <FaArrowLeft />
            Back to Jobs
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Job Posting</h1>
          <p className="text-gray-600 mt-2">Post a job to find the perfect freelancer for your project</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Job Form */}
        <JobPostingForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
      
      <Footer/>
    </div>
  )
}
