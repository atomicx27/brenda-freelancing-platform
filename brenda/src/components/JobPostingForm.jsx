import React, { useState, useEffect } from 'react'
import { FaPlus, FaTimes, FaDollarSign, FaClock, FaMapMarkerAlt, FaLaptop, FaCalendarAlt, FaMagic, FaLightbulb } from 'react-icons/fa'
import AIEnhanceButton, { AIComparisonModal } from './AIEnhanceButton'
import api from '../services/api'

const JobPostingForm = ({ 
  job = null, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  descriptionMinWords = 300,
  descriptionMaxWords = 500,
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
  const [showComparison, setShowComparison] = useState(false)
  const [enhancedDescription, setEnhancedDescription] = useState('')
  const [originalDescription, setOriginalDescription] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [skillSuggestions, setSkillSuggestions] = useState([])
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false)

  // Comprehensive skill list
  const commonSkills = [
    // Web Development
    'React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Node.js', 'Vue.js', 'Angular',
    'Next.js', 'Express.js', 'jQuery', 'Bootstrap', 'Tailwind CSS', 'Sass', 'Webpack',
    // Backend
    'Python', 'Django', 'FastAPI', 'Flask', 'Ruby', 'Ruby on Rails', 'PHP', 'Laravel',
    'Java', 'Spring Boot', 'C#', '.NET', 'ASP.NET', 'Go', 'Rust',
    // Mobile
    'React Native', 'Flutter', 'Swift', 'iOS Development', 'Android Development', 'Kotlin',
    'Xamarin', 'Ionic', 'Mobile App Development',
    // Database
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'SQL', 'NoSQL', 'Oracle',
    'SQL Server', 'Cassandra', 'DynamoDB',
    // DevOps & Cloud
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitLab CI',
    'Terraform', 'Ansible', 'Linux', 'Nginx', 'Apache',
    // Design
    'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Adobe Photoshop', 'Adobe Illustrator',
    'Graphic Design', 'Logo Design', 'Web Design', 'Mobile Design', 'Prototyping',
    'Wireframing', 'InVision', 'Canva',
    // Data Science & AI
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Analysis',
    'Data Visualization', 'Pandas', 'NumPy', 'Scikit-learn', 'NLP', 'Computer Vision',
    'AI', 'Artificial Intelligence', 'Data Science', 'Big Data', 'Tableau', 'Power BI',
    // Marketing
    'Digital Marketing', 'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Social Media Marketing',
    'Content Marketing', 'Email Marketing', 'Marketing Strategy', 'Google Analytics',
    'Copywriting', 'Brand Strategy',
    // Content & Writing
    'Content Writing', 'Technical Writing', 'Copywriting', 'Blog Writing', 'Creative Writing',
    'Proofreading', 'Editing', 'Translation', 'Transcription',
    // Business & Management
    'Project Management', 'Agile', 'Scrum', 'Business Analysis', 'Product Management',
    'Virtual Assistant', 'Data Entry', 'Excel', 'PowerPoint', 'Business Strategy',
    // Other
    'Git', 'GitHub', 'REST API', 'GraphQL', 'Microservices', 'Unit Testing', 'Jest',
    'Selenium', 'Cypress', 'API Integration', 'Payment Integration', 'Stripe API',
    'Video Editing', 'WordPress', 'Shopify', 'E-commerce', 'Blockchain', 'Solidity'
  ].sort()

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
    const trimmedSkill = newSkill.trim()
    
    if (!trimmedSkill) {
      return
    }
    
    // Validate skill length
    if (trimmedSkill.length < 2) {
      setErrors(prev => ({
        ...prev,
        skills: 'Skill must be at least 2 characters'
      }))
      return
    }
    
    if (trimmedSkill.length > 50) {
      setErrors(prev => ({
        ...prev,
        skills: 'Skill must not exceed 50 characters'
      }))
      return
    }
    
    // Check for duplicates
    if (formData.skills.includes(trimmedSkill)) {
      setErrors(prev => ({
        ...prev,
        skills: 'This skill has already been added'
      }))
      return
    }
    
    // Clear errors and add skill
    setErrors(prev => ({
      ...prev,
      skills: ''
    }))
    
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, trimmedSkill]
    }))
    setNewSkill('')
    setShowSkillSuggestions(false)
  }

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSkillInputChange = (e) => {
    const value = e.target.value
    setNewSkill(value)
    
    if (value.trim().length > 0) {
      // Filter skills that match the input
      const filtered = commonSkills.filter(skill =>
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !formData.skills.includes(skill)
      ).slice(0, 10) // Limit to 10 suggestions
      
      setSkillSuggestions(filtered)
      setShowSkillSuggestions(true)
    } else {
      setSkillSuggestions([])
      setShowSkillSuggestions(false)
    }
  }

  const handleSkillSuggestionClick = (skill) => {
    const trimmedSkill = skill.trim()
    
    // Validate before adding
    if (trimmedSkill.length >= 2 && 
        trimmedSkill.length <= 50 && 
        !formData.skills.includes(trimmedSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill]
      }))
    }
    setNewSkill('')
    setSkillSuggestions([])
    setShowSkillSuggestions(false)
  }

  // AI Enhancement Functions
  const handleEnhanceDescription = async (enhanced) => {
    setOriginalDescription(formData.description)
    setEnhancedDescription(enhanced.description || enhanced)
    setShowComparison(true)
  }

  const handleAcceptEnhanced = () => {
    setFormData(prev => ({
      ...prev,
      description: enhancedDescription
    }))
    setShowComparison(false)
  }

  const handleRejectEnhanced = () => {
    setShowComparison(false)
  }

  const handleGetSuggestions = async () => {
    if (!formData.title || !formData.category) {
      setErrors(prev => ({
        ...prev,
        suggestions: 'Please enter a job title and category first'
      }))
      return
    }

    setLoadingSuggestions(true)
    setErrors(prev => ({ ...prev, suggestions: '' }))
    
    try {
      const result = await api.generateJobSuggestions({
        title: formData.title,
        category: formData.category
      })

      console.log('AI Suggestions Result:', result)

      // The backend returns suggestedSkills, suggestedDescription, estimatedBudget
      // Map them to the format the frontend expects
      let suggestions = null
      
      if (result.data) {
        suggestions = {
          skills: result.data.suggestedSkills || [],
          description: result.data.suggestedDescription || '',
          budget: result.data.estimatedBudget || ''
        }
      } else if (result.suggestedSkills || result.suggestedDescription || result.estimatedBudget) {
        // Handle if data is at the top level
        suggestions = {
          skills: result.suggestedSkills || [],
          description: result.suggestedDescription || '',
          budget: result.estimatedBudget || ''
        }
      }

      if (suggestions && (suggestions.skills.length > 0 || suggestions.description || suggestions.budget)) {
        setAiSuggestions(suggestions)
      } else {
        throw new Error('No suggestions found in response')
      }
    } catch (error) {
      console.error('Error getting suggestions:', error)
      setErrors(prev => ({
        ...prev,
        suggestions: error.message || 'Failed to get AI suggestions. Please try again.'
      }))
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleApplySuggestion = (suggestionType, value) => {
    switch (suggestionType) {
      case 'skills':
        if (Array.isArray(value)) {
          // Filter and validate skills before adding
          const validSkills = value
            .map(skill => skill.trim())
            .filter(skill => 
              skill.length >= 2 && 
              skill.length <= 50 && 
              !formData.skills.includes(skill)
            )
          
          setFormData(prev => ({
            ...prev,
            skills: [...prev.skills, ...validSkills]
          }))
        }
        break
      case 'description':
        setFormData(prev => ({
          ...prev,
          description: value
        }))
        break
      case 'budget':
        setFormData(prev => ({
          ...prev,
          budget: value
        }))
        break
      default:
        break
    }
    setAiSuggestions(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required'
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Job title must be at least 5 characters'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required'
    } else if (formData.description.trim().length < descriptionMinWords) {
      newErrors.description = `Job description must be at least ${descriptionMinWords} characters`
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    
    // Validate skills: filter and check
    const validSkills = formData.skills
      .map(skill => skill.trim())
      .filter(skill => skill.length >= 2 && skill.length <= 50)
    
    if (validSkills.length === 0) {
      newErrors.skills = 'At least one valid skill is required (2-50 characters)'
    }
    
    // Check for invalid skills
    const invalidSkills = formData.skills.filter(skill => {
      const trimmed = skill.trim()
      return trimmed.length > 0 && (trimmed.length < 2 || trimmed.length > 50)
    })
    
    if (invalidSkills.length > 0) {
      newErrors.skills = `Invalid skills: "${invalidSkills.join('", "')}" must be between 2-50 characters`
    }
    
    if (formData.budgetType === 'FIXED' && !formData.budget) {
      newErrors.budget = 'Budget is required for fixed price jobs'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Process form data - ensure skills are properly filtered and trimmed
    const processedData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      subcategory: formData.subcategory.trim() || null,
      location: formData.location.trim() || null,
      duration: formData.duration.trim() || null,
      skills: formData.skills
        .map(skill => skill.trim())
        .filter(skill => skill.length >= 2 && skill.length <= 50),
      budget: formData.budget && String(formData.budget).trim() ? parseFloat(formData.budget) : null,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      isRemote: Boolean(formData.isRemote)
    }
    
    console.log('Submitting job data:', processedData)
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Job Description *
            </label>
            <AIEnhanceButton
              originalText={formData.description}
              onEnhanced={handleEnhanceDescription}
              enhanceFunction={(data) => api.enhanceJobDescription(data)}
              additionalData={{
                title: formData.title,
                category: formData.category,
                skills: formData.skills,
                minWords: descriptionMinWords,
                maxWords: descriptionMaxWords
              }}
              buttonText="Enhance with AI"
              type="job"
            />
          </div>
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

        {/* AI Suggestions Panel */}
        {!aiSuggestions && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaLightbulb className="text-yellow-500 text-xl" />
                <div>
                  <h3 className="font-semibold text-gray-800">Get AI Suggestions</h3>
                  <p className="text-sm text-gray-600">
                    Let AI suggest skills, description ideas, and budget based on your job title
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGetSuggestions}
                disabled={loadingSuggestions || !formData.title || !formData.category}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {loadingSuggestions ? 'Loading...' : 'Get Suggestions'}
              </button>
            </div>
            {errors.suggestions && (
              <p className="text-red-500 text-sm mt-2">{errors.suggestions}</p>
            )}
          </div>
        )}

        {/* AI Suggestions Display */}
        {aiSuggestions && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FaMagic className="text-purple-500" />
                AI Suggestions
              </h3>
              <button
                type="button"
                onClick={() => setAiSuggestions(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              {/* Suggested Skills */}
              {aiSuggestions.skills && aiSuggestions.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Suggested Skills</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {aiSuggestions.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplySuggestion('skills', aiSuggestions.skills)}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Add all skills
                  </button>
                </div>
              )}

              {/* Suggested Description */}
              {aiSuggestions.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Suggested Description</h4>
                  <p className="text-sm text-gray-600 bg-white rounded p-3 mb-2">
                    {aiSuggestions.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleApplySuggestion('description', aiSuggestions.description)}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Use this description
                  </button>
                </div>
              )}

              {/* Suggested Budget */}
              {aiSuggestions.budget && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Suggested Budget</h4>
                  <p className="text-sm text-gray-600 bg-white rounded p-3 mb-2">
                    {aiSuggestions.budget}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Extract first number from budget string if possible
                      const budgetMatch = aiSuggestions.budget.match(/\d+/);
                      const budgetValue = budgetMatch ? budgetMatch[0] : '';
                      handleApplySuggestion('budget', budgetValue)
                    }}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Use this budget
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={handleSkillInputChange}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
                onFocus={() => newSkill.trim() && setShowSkillSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type to search skills (e.g., React, JavaScript, UI/UX)"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleSkillAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
              </button>
            </div>
            
            {/* Skill Suggestions Dropdown */}
            {showSkillSuggestions && skillSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {skillSuggestions.map((skill, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSkillSuggestionClick(skill)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
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

      {/* AI Comparison Modal */}
      <AIComparisonModal
        original={originalDescription}
        enhanced={enhancedDescription}
        onAccept={handleAcceptEnhanced}
        onReject={handleRejectEnhanced}
        isOpen={showComparison}
      />
    </div>
  )
}

export default JobPostingForm
