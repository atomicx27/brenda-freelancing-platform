import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import HeadTag from '../components/HeadTag.jsx'
import Footer from '../components/Footer.jsx'
import ProfilePictureUpload from '../components/ProfilePictureUpload.jsx'
import apiService, { resolveAssetUrl } from '../services/api'

export default function Profile() {
  const { user, updateProfile, loading } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    linkedin: '',
    github: '',
    twitter: '',
    // Freelancer specific
    title: '',
    company: '',
    experience: '',
    hourlyRate: '',
    availability: 'Available',
    skills: [],
    languages: []
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [avatar, setAvatar] = useState(user?.avatar || null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [resumeInfo, setResumeInfo] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeError, setResumeError] = useState(null)

  const createEmptyExperienceEntry = () => ({ title: '', description: '' })
  const createEmptyProjectEntry = () => ({ title: '', description: '' })
  const createEmptyAchievementEntry = () => ({ title: '', description: '' })

  const [experienceEntries, setExperienceEntries] = useState(() => [createEmptyExperienceEntry()])
  const [projectEntries, setProjectEntries] = useState(() => [createEmptyProjectEntry()])
  const [achievementEntries, setAchievementEntries] = useState(() => [createEmptyAchievementEntry()])

  const normalizeResumeEntries = useCallback((entries = []) => {
    if (!Array.isArray(entries)) {
      return []
    }

    return entries
      .map(entry => {
        if (!entry) return null
        if (typeof entry === 'string') {
          return {
            title: entry,
            description: ''
          }
        }

        const title = entry.title || entry.summary || entry.description || ''
        const description = entry.description || entry.summary || ''

        if (!title && !description) {
          return null
        }

        return {
          title: title || description,
          description
        }
      })
      .filter(Boolean)
  }, [])

  const handleExperienceEntryChange = (index, field, value) => {
    setExperienceEntries(prev => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)))
  }

  const addExperienceEntry = () => {
    setExperienceEntries(prev => [...prev, createEmptyExperienceEntry()])
  }

  const removeExperienceEntry = (index) => {
    setExperienceEntries(prev => {
      if (prev.length <= 1) {
        return [createEmptyExperienceEntry()]
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleProjectEntryChange = (index, field, value) => {
    setProjectEntries(prev => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)))
  }

  const addProjectEntry = () => {
    setProjectEntries(prev => [...prev, createEmptyProjectEntry()])
  }

  const removeProjectEntry = (index) => {
    setProjectEntries(prev => {
      if (prev.length <= 1) {
        return [createEmptyProjectEntry()]
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleAchievementEntryChange = (index, field, value) => {
    setAchievementEntries(prev => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)))
  }

  const addAchievementEntry = () => {
    setAchievementEntries(prev => [...prev, createEmptyAchievementEntry()])
  }

  const removeAchievementEntry = (index) => {
    setAchievementEntries(prev => {
      if (prev.length <= 1) {
        return [createEmptyAchievementEntry()]
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        phone: user.phone || '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        twitter: user.twitter || ''
      }))
      setAvatar(user.avatar || null)
    }
  }, [user])

  const loadProfileDetails = useCallback(async () => {
    if (!user) return

    try {
      setProfileLoading(true)
      const response = await apiService.getUserProfile()
      const profile = response.data?.profile

      if (profile) {
        setFormData(prev => ({
          ...prev,
          title: profile.title || '',
          company: profile.company || '',
          experience: profile.experience != null ? String(profile.experience) : prev.experience,
          hourlyRate: profile.hourlyRate != null ? String(profile.hourlyRate) : prev.hourlyRate,
          availability: profile.availability || prev.availability || 'Available',
          skills: Array.isArray(profile.skills) ? profile.skills : prev.skills,
          languages: Array.isArray(profile.languages) ? profile.languages : prev.languages
        }))

        const normalizedExperience = normalizeResumeEntries(profile.resumeExperience)
        setExperienceEntries(normalizedExperience.length ? normalizedExperience : [createEmptyExperienceEntry()])

        const normalizedProjects = normalizeResumeEntries(profile.resumeProjects)
        setProjectEntries(normalizedProjects.length ? normalizedProjects : [createEmptyProjectEntry()])

        const normalizedAchievements = normalizeResumeEntries(profile.resumeAchievements)
        setAchievementEntries(normalizedAchievements.length ? normalizedAchievements : [createEmptyAchievementEntry()])

        if (profile.resumeUrl) {
          setResumeInfo({
            url: profile.resumeUrl,
            uploadedAt: profile.resumeUploadedAt,
            autoFilledFields: [],
            websites: [],
            linkedinUrls: [],
            githubUrls: []
          })
        } else {
          setResumeInfo(null)
        }
      } else {
        setResumeInfo(null)
        setExperienceEntries([createEmptyExperienceEntry()])
        setProjectEntries([createEmptyProjectEntry()])
        setAchievementEntries([createEmptyAchievementEntry()])
      }
    } catch (error) {
      console.error('Failed to load profile details:', error)
    } finally {
      setProfileLoading(false)
    }
  }, [user, normalizeResumeEntries])

  useEffect(() => {
    if (user?.userType === 'FREELANCER') {
      loadProfileDetails()
    }
  }, [user, loadProfileDetails])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSkillAdd = (skill) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }))
    }
  }

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleLanguageAdd = (language) => {
    if (language.trim() && !formData.languages.includes(language.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language.trim()]
      }))
    }
  }

  const handleLanguageRemove = (languageToRemove) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== languageToRemove)
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters'
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (user?.userType === 'FREELANCER') {
      if (formData.hourlyRate && (isNaN(formData.hourlyRate) || formData.hourlyRate < 0)) {
        newErrors.hourlyRate = 'Hourly rate must be a positive number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const sanitizeEntriesForSubmit = (entries) =>
    entries
      .map(entry => ({
        title: (entry.title || '').trim(),
        description: (entry.description || '').trim()
      }))
      .filter(entry => entry.title || entry.description)
      .slice(0, 12)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const experiencePayload = sanitizeEntriesForSubmit(experienceEntries)
    const projectPayload = sanitizeEntriesForSubmit(projectEntries)
    const achievementPayload = sanitizeEntriesForSubmit(achievementEntries)

    setIsLoading(true)
    const result = await updateProfile({
      ...formData,
      experienceEntries: experiencePayload,
      projectEntries: projectPayload,
      achievementEntries: achievementPayload
    })

    if (result.success) {
      // Show success message
      alert('Profile updated successfully!')
      if (user?.userType === 'FREELANCER') {
        loadProfileDetails()
      }
    } else {
      setErrors({ general: result.error })
    }
    
    setIsLoading(false)
  }

  // Handle avatar upload
  const handleAvatarUpload = async (avatarUrl) => {
    try {
      // Update the avatar in the form data
      const updatedData = { ...formData, avatar: avatarUrl }
      const result = await updateProfile(updatedData)
      
      if (result.success) {
        setAvatar(avatarUrl)
      }
    } catch (error) {
      console.error('Avatar update failed:', error)
    }
  }

  // Handle avatar upload error
  const handleAvatarError = (error) => {
    setErrors({ general: error })
  }

  const handleResumeUpload = async (file) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      setResumeError('Please upload a PDF resume.')
      return
    }

    try {
      setResumeUploading(true)
      setResumeError(null)
      const response = await apiService.uploadResume(file)
      const profile = response.data?.profile
      const parsedResume = response.data?.parsedResume
      const autoFilledFields = response.data?.autoFilledFields || []
      const userUpdates = response.data?.user

      if (response.success && profile) {
        const normalizedExperience = normalizeResumeEntries(profile.resumeExperience ?? parsedResume?.experience)
        const normalizedProjects = normalizeResumeEntries(profile.resumeProjects ?? parsedResume?.projects)
        const normalizedAchievements = normalizeResumeEntries(profile.resumeAchievements ?? parsedResume?.achievements)

        setResumeInfo({
          url: profile.resumeUrl,
          uploadedAt: profile.resumeUploadedAt,
          autoFilledFields,
          websites: parsedResume?.websites || [],
          linkedinUrls: parsedResume?.linkedinUrls || [],
          githubUrls: parsedResume?.githubUrls || []
        })

        setExperienceEntries(normalizedExperience.length ? normalizedExperience : [createEmptyExperienceEntry()])
        setProjectEntries(normalizedProjects.length ? normalizedProjects : [createEmptyProjectEntry()])
        setAchievementEntries(normalizedAchievements.length ? normalizedAchievements : [createEmptyAchievementEntry()])

        setFormData(prev => ({
          ...prev,
          title: profile.title ?? prev.title,
          company: profile.company ?? prev.company,
          availability: profile.availability ?? prev.availability,
          bio: userUpdates?.bio ?? prev.bio,
          skills: Array.isArray(profile.skills) && profile.skills.length > 0 ? profile.skills : prev.skills,
          languages: Array.isArray(profile.languages) && profile.languages.length > 0 ? profile.languages : prev.languages,
          website: userUpdates?.website ?? prev.website,
          linkedin: userUpdates?.linkedin ?? prev.linkedin,
          github: userUpdates?.github ?? prev.github
        }))

        if (autoFilledFields.length > 0) {
          alert(`Resume uploaded successfully! We filled in: ${autoFilledFields.join(', ')}`)
        } else {
          alert('Resume uploaded successfully! We used your resume to enhance your profile.')
        }
      } else {
        setResumeError(response.message || 'Resume upload failed')
      }
    } catch (error) {
      setResumeError(error.message || 'Resume upload failed')
    } finally {
      setResumeUploading(false)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h1>
          <a href="/account-security/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title="Profile - Brenda"/>
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-6">
            <ProfilePictureUpload
              currentAvatar={avatar ? resolveAssetUrl(avatar) : null}
              onUpload={handleAvatarUpload}
              onError={handleAvatarError}
              userId={user.id}
              userName={`${user.firstName} ${user.lastName}`}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 capitalize">{user.userType.toLowerCase()}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('personal')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'personal'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Personal Information
              </button>
              {user.userType === 'FREELANCER' && (
                <button
                  onClick={() => setActiveTab('professional')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'professional'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Professional Profile
                </button>
              )}
              <button
                onClick={() => setActiveTab('account')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'account'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Account Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'personal' && (
              <PersonalInfoTab 
                formData={formData}
                handleChange={handleChange}
                errors={errors}
              />
            )}

            {activeTab === 'professional' && user.userType === 'FREELANCER' && (
              <ProfessionalTab 
                formData={formData}
                handleChange={handleChange}
                handleSkillAdd={handleSkillAdd}
                handleSkillRemove={handleSkillRemove}
                handleLanguageAdd={handleLanguageAdd}
                handleLanguageRemove={handleLanguageRemove}
                errors={errors}
                resumeInfo={resumeInfo}
                onResumeUpload={handleResumeUpload}
                resumeUploading={resumeUploading}
                resumeError={resumeError}
                experienceEntries={experienceEntries}
                onExperienceChange={handleExperienceEntryChange}
                onAddExperience={addExperienceEntry}
                onRemoveExperience={removeExperienceEntry}
                projectEntries={projectEntries}
                onProjectChange={handleProjectEntryChange}
                onAddProject={addProjectEntry}
                onRemoveProject={removeProjectEntry}
                achievementEntries={achievementEntries}
                onAchievementChange={handleAchievementEntryChange}
                onAddAchievement={addAchievementEntry}
                onRemoveAchievement={removeAchievementEntry}
              />
            )}

            {activeTab === 'account' && (
              <AccountTab 
                user={user}
              />
            )}

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

// Personal Information Tab Component
function PersonalInfoTab({ formData, handleChange, errors }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.bio ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Tell us about yourself..."
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.bio.length}/500 characters
        </p>
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="City, Country"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+1 (555) 123-4567"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website
        </label>
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.website ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="https://yourwebsite.com"
        />
        {errors.website && (
          <p className="mt-1 text-sm text-red-600">{errors.website}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn
          </label>
          <input
            type="url"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub
          </label>
          <input
            type="url"
            name="github"
            value={formData.github}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://github.com/yourusername"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Twitter
          </label>
          <input
            type="url"
            name="twitter"
            value={formData.twitter}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://twitter.com/yourusername"
          />
        </div>
      </div>
    </div>
  )
}

// Professional Tab Component (for freelancers)
function ProfessionalTab({ 
  formData, 
  handleChange, 
  handleSkillAdd, 
  handleSkillRemove, 
  handleLanguageAdd, 
  handleLanguageRemove, 
  errors,
  resumeInfo,
  onResumeUpload,
  resumeUploading,
  resumeError,
  experienceEntries,
  onExperienceChange,
  onAddExperience,
  onRemoveExperience,
  projectEntries,
  onProjectChange,
  onAddProject,
  onRemoveProject,
  achievementEntries,
  onAchievementChange,
  onAddAchievement,
  onRemoveAchievement
}) {
  const [newSkill, setNewSkill] = useState('')
  const [newLanguage, setNewLanguage] = useState('')
  const handleResumeChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      onResumeUpload(file)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Professional Profile</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Senior Web Developer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Freelance, Google, Microsoft"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <select
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select experience</option>
            <option value="0-1">0-1 years</option>
            <option value="1-3">1-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hourly Rate ($)
          </label>
          <input
            type="number"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.hourlyRate ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="50"
            min="0"
          />
          {errors.hourlyRate && (
            <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Availability
        </label>
        <select
          name="availability"
          value={formData.availability}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Available">Available</option>
          <option value="Busy">Busy</option>
          <option value="Not Available">Not Available</option>
        </select>
      </div>

      {/* Skills Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSkillAdd(newSkill)
                setNewSkill('')
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a skill..."
          />
          <button
            type="button"
            onClick={() => {
              handleSkillAdd(newSkill)
              setNewSkill('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleSkillRemove(skill)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Languages Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleLanguageAdd(newLanguage)
                setNewLanguage('')
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a language..."
          />
          <button
            type="button"
            onClick={() => {
              handleLanguageAdd(newLanguage)
              setNewLanguage('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.languages.map((language, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
            >
              {language}
              <button
                type="button"
                onClick={() => handleLanguageRemove(language)}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Resume Upload */}
      <div className="border-t border-gray-200 pt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h4 className="text-md font-semibold text-gray-900">Resume</h4>
            <p className="text-sm text-gray-600">
              Upload your resume as a PDF. This is required before you can submit job proposals.
            </p>
          </div>
          {resumeInfo?.url && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.open(resumeInfo.url, '_blank', 'noopener')}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors text-sm"
              >
                Preview Resume
              </button>
              <a
                href={resumeInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-100"
              >
                Download PDF
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleResumeChange}
            className="block w-full text-sm text-gray-600"
          />
          {resumeUploading && (
            <span className="text-sm text-gray-500">Uploading...</span>
          )}
        </div>
        {resumeError && (
          <p className="text-sm text-red-600">{resumeError}</p>
        )}

        {resumeInfo?.uploadedAt && (
          <p className="text-sm text-gray-500">
            Last uploaded on {new Date(resumeInfo.uploadedAt).toLocaleString()}
          </p>
        )}

        {resumeInfo?.autoFilledFields?.length > 0 && (
          <p className="text-sm text-green-600">
            Auto-filled from your resume: {resumeInfo.autoFilledFields.join(', ')}
          </p>
        )}

        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-900">Experience</h4>
            <button
              type="button"
              onClick={onAddExperience}
              className="text-sm px-3 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
            >
              Add Experience
            </button>
          </div>
          {experienceEntries.map((entry, index) => (
            <div key={`experience-${index}`} className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Entry {index + 1}</span>
                {experienceEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveExperience(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="text"
                value={entry.title}
                onChange={(e) => onExperienceChange(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Role or headline"
              />
              <textarea
                value={entry.description}
                onChange={(e) => onExperienceChange(index, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description or achievements"
              />
            </div>
          ))}
          <p className="text-xs text-gray-500">Add up to 12 concise experience highlights.</p>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-900">Projects</h4>
            <button
              type="button"
              onClick={onAddProject}
              className="text-sm px-3 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
            >
              Add Project
            </button>
          </div>
          {projectEntries.map((entry, index) => (
            <div key={`project-${index}`} className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Project {index + 1}</span>
                {projectEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveProject(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="text"
                value={entry.title}
                onChange={(e) => onProjectChange(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project name"
              />
              <textarea
                value={entry.description}
                onChange={(e) => onProjectChange(index, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="One or two sentence project summary"
              />
            </div>
          ))}
          <p className="text-xs text-gray-500">Add up to 12 project highlights that best represent your work.</p>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-900">Achievements</h4>
            <button
              type="button"
              onClick={onAddAchievement}
              className="text-sm px-3 py-1 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
            >
              Add Achievement
            </button>
          </div>
          {achievementEntries.map((entry, index) => (
            <div key={`achievement-${index}`} className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Achievement {index + 1}</span>
                {achievementEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveAchievement(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="text"
                value={entry.title}
                onChange={(e) => onAchievementChange(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Achievement title"
              />
              <textarea
                value={entry.description}
                onChange={(e) => onAchievementChange(index, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the achievement"
              />
            </div>
          ))}
          <p className="text-xs text-gray-500">Add up to 12 notable achievements.</p>
        </div>
      </div>
    </div>
  )
}

// Account Tab Component
function AccountTab({ user }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Account Type</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{user.userType.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Member Since</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.isVerified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Security</h4>
        <div className="space-y-4">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Change Password
          </button>
          <div className="text-sm text-gray-500">
            Two-factor authentication is not enabled.
          </div>
        </div>
      </div>
    </div>
  )
}
