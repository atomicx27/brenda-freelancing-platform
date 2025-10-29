import React, { useState, useEffect } from 'react'
import { FaPlus, FaTimes, FaBuilding, FaGlobe, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaIndustry } from 'react-icons/fa'

const CompanyProfileForm = ({ 
  profile = null, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    tagline: '',
    description: '',
    website: '',
    logo: '',
    industry: '',
    companySize: '',
    foundedYear: '',
    headquarters: '',
    phone: '',
    email: '',
    address: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    values: [],
    culture: '',
    benefits: [],
    lookingFor: '',
    skillsNeeded: [],
    projectTypes: [],
    isPublic: true,
    showStats: true
  })
  const [errors, setErrors] = useState({})
  const [newValue, setNewValue] = useState('')
  const [newBenefit, setNewBenefit] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newProjectType, setNewProjectType] = useState('')

  // Predefined options
  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'E-commerce',
    'Manufacturing',
    'Consulting',
    'Marketing',
    'Real Estate',
    'Entertainment',
    'Non-profit',
    'Other'
  ]

  const companySizes = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+'
  ]

  const projectTypeOptions = [
    'Web Development',
    'Mobile App Development',
    'UI/UX Design',
    'Graphic Design',
    'Content Writing',
    'Marketing',
    'Data Analysis',
    'Consulting',
    'Other'
  ]

  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || '',
        tagline: profile.tagline || '',
        description: profile.description || '',
        website: profile.website || '',
        logo: profile.logo || '',
        industry: profile.industry || '',
        companySize: profile.companySize || '',
        foundedYear: profile.foundedYear || '',
        headquarters: profile.headquarters || '',
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        linkedin: profile.linkedin || '',
        twitter: profile.twitter || '',
        facebook: profile.facebook || '',
        instagram: profile.instagram || '',
        values: profile.values || [],
        culture: profile.culture || '',
        benefits: profile.benefits || [],
        lookingFor: profile.lookingFor || '',
        skillsNeeded: profile.skillsNeeded || [],
        projectTypes: profile.projectTypes || [],
        isPublic: profile.isPublic !== undefined ? profile.isPublic : true,
        showStats: profile.showStats !== undefined ? profile.showStats : true
      })
    }
  }, [profile])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddItem = (field, newItem, setNewItem) => {
    if (newItem.trim() && !formData[field].includes(newItem.trim())) {
      handleArrayChange(field, [...formData[field], newItem.trim()])
      setNewItem('')
    }
  }

  const handleRemoveItem = (field, itemToRemove) => {
    handleArrayChange(field, formData[field].filter(item => item !== itemToRemove))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.foundedYear && (formData.foundedYear < 1800 || formData.foundedYear > new Date().getFullYear())) {
      newErrors.foundedYear = 'Please enter a valid founded year'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {profile ? 'Edit Company Profile' : 'Create Company Profile'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaBuilding className="mr-2" />
                Company Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your company's tagline or slogan"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about your company, what you do, and your mission..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaGlobe className="inline mr-1" />
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
                    placeholder="https://yourcompany.com"
                  />
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://yourcompany.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaIndustry className="mr-2" />
                Business Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaUsers className="inline mr-1" />
                    Company Size
                  </label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select size</option>
                    {companySizes.map(size => (
                      <option key={size} value={size}>
                        {size} employees
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCalendarAlt className="inline mr-1" />
                    Founded Year
                  </label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={formData.foundedYear}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.foundedYear ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="2020"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                  {errors.foundedYear && (
                    <p className="mt-1 text-sm text-red-600">{errors.foundedYear}</p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaMapMarkerAlt className="inline mr-1" />
                    Headquarters
                  </label>
                  <input
                    type="text"
                    name="headquarters"
                    value={formData.headquarters}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaPhone className="mr-2" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaPhone className="inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaEnvelope className="inline mr-1" />
                    Public Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="contact@yourcompany.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaMapMarkerAlt className="inline mr-1" />
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full business address"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="https://linkedin.com/company/yourcompany"
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
                    placeholder="https://twitter.com/yourcompany"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/yourcompany"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/yourcompany"
                  />
                </div>
              </div>
            </div>

            {/* Company Culture */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Culture & Values</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Values
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddItem('values', newValue, setNewValue)
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a company value"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddItem('values', newValue, setNewValue)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.values.map((value, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('values', value)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Culture
                  </label>
                  <textarea
                    name="culture"
                    value={formData.culture}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your company culture, work environment, and what makes your company unique..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Benefits
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddItem('benefits', newBenefit, setNewBenefit)
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a benefit (e.g., Health Insurance, Remote Work)"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddItem('benefits', newBenefit, setNewBenefit)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {benefit}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('benefits', benefit)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* What We're Looking For */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What We're Looking For</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="lookingFor"
                    value={formData.lookingFor}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what you're looking for in freelancers, your ideal working relationship, and what makes a great collaboration..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills We Commonly Need
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddItem('skillsNeeded', newSkill, setNewSkill)
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a skill (e.g., React, Python, Design)"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddItem('skillsNeeded', newSkill, setNewSkill)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skillsNeeded.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('skillsNeeded', skill)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Types We Post
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newProjectType}
                      onChange={(e) => setNewProjectType(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddItem('projectTypes', newProjectType, setNewProjectType)
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a project type"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddItem('projectTypes', newProjectType, setNewProjectType)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.projectTypes.map((type, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('projectTypes', type)}
                          className="ml-2 text-orange-600 hover:text-orange-800"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Make company profile public
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="showStats"
                    checked={formData.showStats}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Show company statistics
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? 'Saving...' : 'Save Company Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CompanyProfileForm
