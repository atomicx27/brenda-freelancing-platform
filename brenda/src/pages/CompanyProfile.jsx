import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import HeadTag from '../components/HeadTag.jsx'
import Footer from '../components/Footer.jsx'
import CompanyProfileCard from '../components/CompanyProfileCard.jsx'
import CompanyProfileForm from '../components/CompanyProfileForm.jsx'
import { FaBuilding, FaPlus, FaEdit, FaChartBar } from 'react-icons/fa'
import apiService from '../services/api'

export default function CompanyProfile() {
  const { user, isAuthenticated } = useAuth()
  const [companyProfile, setCompanyProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
    averageJobValue: 0,
    totalProposals: 0,
    acceptedProposals: 0
  })

  // Load company profile
  useEffect(() => {
    if (isAuthenticated && user?.userType === 'CLIENT') {
      loadCompanyProfile()
      loadCompanyStats()
    }
  }, [isAuthenticated, user])

  const loadCompanyProfile = async () => {
    try {
      setLoading(true)
      const response = await apiService.getCompanyProfile()
      setCompanyProfile(response.data)
    } catch (err) {
      setError('Error loading company profile')
      console.error('Error loading company profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCompanyStats = async () => {
    try {
      const response = await apiService.getCompanyStats()
      setStats(response.data)
    } catch (err) {
      console.error('Error loading company stats:', err)
      // If company profile doesn't exist, set empty stats
      if (err.message?.includes('Company profile not found')) {
        setStats({
          totalJobs: 0,
          activeJobs: 0,
          completedJobs: 0,
          totalSpent: 0,
          averageJobValue: 0,
          totalProposals: 0,
          acceptedProposals: 0
        })
      }
    }
  }

  const handleCreateProfile = () => {
    setShowForm(true)
  }

  const handleEditProfile = (profile) => {
    setShowForm(true)
  }

  const handleToggleVisibility = async (profileId) => {
    try {
      await apiService.updateCompanyProfile({ isPublic: !companyProfile.isPublic })
      setCompanyProfile(prev => ({
        ...prev,
        isPublic: !prev.isPublic
      }))
    } catch (err) {
      setError('Error updating profile visibility')
      console.error('Error updating visibility:', err)
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      
      // Convert foundedYear to integer if it exists
      const processedData = {
        ...formData,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null
      }
      
      console.log('Submitting company profile data:', processedData)
      
      const response = await apiService.updateCompanyProfile(processedData)
      setCompanyProfile(response.data)
      setShowForm(false)
      // Reload stats after profile update
      loadCompanyStats()
    } catch (err) {
      setError('Error saving company profile')
      console.error('Error saving profile:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your company profile</h1>
          <a href="/account-security/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </div>
    )
  }

  if (user?.userType !== 'CLIENT') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company profiles are only available for clients</h1>
          <a href="/profile" className="text-blue-600 hover:underline">Go to Profile</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title="Company Profile - Brenda"/>
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FaBuilding className="mr-3 text-blue-600" />
                Company Profile
              </h1>
              <p className="text-gray-600 mt-1">Showcase your company and attract top freelancers</p>
            </div>
            <div className="flex items-center space-x-3">
              {stats && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Projects</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalProjects}</div>
                </div>
              )}
              <button
                onClick={companyProfile ? () => handleEditProfile(companyProfile) : handleCreateProfile}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <FaEdit />
                <span>{companyProfile ? 'Edit Profile' : 'Create Profile'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Company Profile Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : companyProfile ? (
          <CompanyProfileCard
            profile={companyProfile}
            onEdit={handleEditProfile}
            onToggleVisibility={handleToggleVisibility}
            isOwner={true}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <FaBuilding className="text-6xl mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No company profile yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your company profile to showcase your business and attract top freelancers
            </p>
            <button
              onClick={handleCreateProfile}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Create Company Profile
            </button>
          </div>
        )}

        {/* Company Profile Form Modal */}
        {showForm && (
          <CompanyProfileForm
            profile={companyProfile}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        )}
      </div>

      <Footer />
    </div>
  )
}
