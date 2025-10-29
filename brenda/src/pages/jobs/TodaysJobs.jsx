import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import HeadTag from '../../components/HeadTag.jsx'
import Footer from '../../components/Footer.jsx'
import JobCard from '../../components/JobCard.jsx'
import apiService from '../../services/api'
import { FaSpinner, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa'

export default function TodaysJobs() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadTodaysJobs()
  }, [])

  const loadTodaysJobs = async () => {
    try {
      setLoading(true)
      const response = await apiService.getTodaysJobs()
      setJobs(response.data)
    } catch (err) {
      setError('Failed to load today\'s jobs')
      console.error('Error loading today\'s jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title="Today's Jobs - Brenda"/>
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaCalendarAlt className="text-blue-600" />
                Today's Jobs
              </h1>
              <p className="text-gray-600 mt-2">Fresh opportunities posted today</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {jobs.length} New Jobs Today
                </h2>
                <p className="text-gray-600">
                  Posted on {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              {isAuthenticated && user?.userType === 'CLIENT' && (
                <button
                  onClick={() => navigate('/jobs/create')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Post a Job
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading today's jobs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Unable to load jobs</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={loadTodaysJobs}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No jobs posted today</h3>
              <p className="text-gray-600 mb-6">
                Check back later or browse all available jobs.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate('/jobs/all-jobs')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse All Jobs
                </button>
                {isAuthenticated && user?.userType === 'CLIENT' && (
                  <button
                    onClick={() => navigate('/jobs/create')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Post a Job
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
      
      <Footer/>
    </div>
  )
}


