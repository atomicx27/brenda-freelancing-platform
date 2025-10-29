import React, { useState, useEffect } from 'react'
import { FaPlus, FaTimes, FaDollarSign, FaClock, FaMapMarkerAlt, FaLaptop, FaCalendarAlt } from 'react-icons/fa'

const JobPostingForm = ({ 
  job = null, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    budgetType: 'FIXED',
    duration: '',
    skills: [],
    category: '',
    subcategory: '',
    location: '',
    isRemote: false,
    deadline: ''
  })
  const [errors, setErrors] = useState({})
  const [newSkill, setNewSkill] = useState('')

  // Predefined categories
  const categories = [
    'Web Development',
    'Mobile Development',
    'Design & Creative',
    'Writing & Translation',
    'Digital Marketing',
    'Data Science & Analytics',
    'Engineering & Architecture',
    'Customer Service',
    'Sales & Marketing',
    'Legal',
    'Finance & Accounting',
    'HR & Training',
    'Other'
  ]

  const budgetTypes = [
    { value: 'FIXED', label: 'Fixed Price' },
    { value: 'HOURLY', label: 'Hourly Rate' },
    { value: 'RANGE', label: 'Budget Range' }
  ]

  const durationOptions = [
    'Less than 1 week',
    '1 to 4 weeks',
    '1 to 3 months',
    '3 to 6 months',
    'More than 6 months'
  ]

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        budget: job.budget || '',
        budgetType: job.budgetType || 'FIXED',
        duration: job.duration || '',
        skills: job.skills || [],
        category: job.category || '',
        subcategory: job.subcategory || '',
        location: job.location || '',
        isRemote: job.isRemote || false,
        deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : ''
      })
    }
  }, [job])

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

  const handleSkillAdd = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required'
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    
    if (formData.skills.length === 0) {
      newErrors.skills = 'At least one skill is required'
    }
    
    if (formData.budgetType === 'FIXED' && !formData.budget) {
      newErrors.budget = 'Budget is required for fixed price jobs'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Process form data
    const processedData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      subcategory: formData.subcategory.trim() || null,
      location: formData.location.trim() || null,
      duration: formData.duration.trim() || null,
      skills: formData.skills.filter(skill => skill.trim().length > 0),
      budget: formData.budget && String(formData.budget).trim() ? parseFloat(formData.budget) : null,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      isRemote: Boolean(formData.isRemote)
    }
    
    onSubmit(processedData)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {job ? 'Edit Job Posting' : 'Create New Job Posting'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., React Developer for E-commerce Website"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the project, requirements, and what you're looking for..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Category and Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <input
              type="text"
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Frontend Development"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Skills *
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
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
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a skill (e.g., React, JavaScript, UI/UX)"
            />
            <button
              type="button"
              onClick={handleSkillAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
            </button>
          </div>
          {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
        </div>

        {/* Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Type
            </label>
            <select
              name="budgetType"
              value={formData.budgetType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {budgetTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget {formData.budgetType === 'FIXED' ? '*' : ''} ($)
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.budget ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={formData.budgetType === 'HOURLY' ? 'e.g., 25' : 'e.g., 1000'}
            />
            {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Duration
          </label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select duration</option>
            {durationOptions.map(duration => (
              <option key={duration} value={duration}>{duration}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., New York, NY"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Remote Work */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isRemote"
            checked={formData.isRemote}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            This is a remote job
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Saving...' : (job ? 'Update Job' : 'Post Job')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default JobPostingForm
