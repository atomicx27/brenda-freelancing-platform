import React, { useState, useEffect } from 'react'
import { FaTimes } from 'react-icons/fa'
import PortfolioFormFields from './PortfolioFormFields'

const PortfolioForm = ({ 
  item = null, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    technologies: [],
    liveUrl: '',
    githubUrl: '',
    startDate: '',
    endDate: '',
    isPublic: true,
    featured: false
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        tags: item.tags || [],
        technologies: item.technologies || [],
        liveUrl: item.liveUrl || '',
        githubUrl: item.githubUrl || '',
        startDate: item.startDate ? item.startDate.split('T')[0] : '',
        endDate: item.endDate ? item.endDate.split('T')[0] : '',
        isPublic: item.isPublic !== undefined ? item.isPublic : true,
        featured: item.featured || false
      })
    }
  }, [item])

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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (formData.liveUrl && !/^https?:\/\/.+/.test(formData.liveUrl)) {
      newErrors.liveUrl = 'Live URL must start with http:// or https://'
    }

    if (formData.githubUrl && !/^https?:\/\/.+/.test(formData.githubUrl)) {
      newErrors.githubUrl = 'GitHub URL must start with http:// or https://'
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date'
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {item ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
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
            <PortfolioFormFields
              formData={formData}
              errors={errors}
              onChange={handleChange}
              onArrayChange={handleArrayChange}
            />

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
                {isLoading ? 'Saving...' : (item ? 'Update' : 'Add')} Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PortfolioForm
