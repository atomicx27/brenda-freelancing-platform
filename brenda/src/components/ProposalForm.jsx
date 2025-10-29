import React, { useState, useEffect } from 'react'
import { FaPaperPlane, FaDollarSign, FaClock, FaUser, FaTimes } from 'react-icons/fa'

const ProposalForm = ({ 
  job, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  existingProposal = null 
}) => {
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedRate: '',
    estimatedDuration: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (existingProposal) {
      setFormData({
        coverLetter: existingProposal.coverLetter || '',
        proposedRate: existingProposal.proposedRate || '',
        estimatedDuration: existingProposal.estimatedDuration || ''
      })
    }
  }, [existingProposal])

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

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors = {}
    
    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required'
    } else if (formData.coverLetter.trim().length < 50) {
      newErrors.coverLetter = 'Cover letter must be at least 50 characters'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Process form data
    const processedData = {
      jobId: job.id,
      coverLetter: formData.coverLetter.trim(),
      proposedRate: formData.proposedRate ? parseFloat(formData.proposedRate) : null,
      estimatedDuration: formData.estimatedDuration.trim() || null
    }
    
    onSubmit(processedData)
  }

  const formatBudget = (budget, budgetType) => {
    if (!budget) return 'Budget not specified'
    
    const formattedBudget = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(budget)

    switch (budgetType) {
      case 'HOURLY':
        return `${formattedBudget}/hour`
      case 'RANGE':
        return `${formattedBudget} range`
      default:
        return formattedBudget
    }
  }

  const durationOptions = [
    'Less than 1 week',
    '1 to 4 weeks',
    '1 to 3 months',
    '3 to 6 months',
    'More than 6 months'
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {existingProposal ? 'Edit Proposal' : 'Submit Proposal'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      {/* Job Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">{job.title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FaDollarSign className="text-xs" />
            <span>{formatBudget(job.budget, job.budgetType)}</span>
          </div>
          {job.duration && (
            <div className="flex items-center gap-2">
              <FaClock className="text-xs" />
              <span>{job.duration}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <FaUser className="text-xs" />
            <span>{job.owner?.company?.companyName || `${job.owner?.firstName} ${job.owner?.lastName}`}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Letter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Letter *
          </label>
          <textarea
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleChange}
            rows={8}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.coverLetter ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Write a compelling cover letter explaining why you're the best fit for this project. Include your relevant experience, approach to the work, and any questions you have about the project..."
          />
          <div className="flex justify-between items-center mt-1">
            {errors.coverLetter && (
              <p className="text-red-500 text-sm">{errors.coverLetter}</p>
            )}
            <p className="text-gray-500 text-sm ml-auto">
              {formData.coverLetter.length}/2000 characters
            </p>
          </div>
        </div>

        {/* Proposed Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proposed Rate ($)
          </label>
          <input
            type="number"
            name="proposedRate"
            value={formData.proposedRate}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={job.budgetType === 'HOURLY' ? 'e.g., 25' : 'e.g., 1000'}
          />
          <p className="text-gray-500 text-sm mt-1">
            {job.budgetType === 'HOURLY' 
              ? 'Your hourly rate for this project'
              : 'Your total price for this project'
            }
          </p>
        </div>

        {/* Estimated Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Duration
          </label>
          <select
            name="estimatedDuration"
            value={formData.estimatedDuration}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select duration</option>
            {durationOptions.map(duration => (
              <option key={duration} value={duration}>{duration}</option>
            ))}
          </select>
          <p className="text-gray-500 text-sm mt-1">
            How long do you estimate this project will take?
          </p>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Tips for a great proposal:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Address the client by name and reference specific project details</li>
            <li>• Highlight relevant experience and past similar projects</li>
            <li>• Explain your approach and methodology</li>
            <li>• Ask thoughtful questions about the project</li>
            <li>• Be professional but personable</li>
          </ul>
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
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaPaperPlane />
            {isLoading ? 'Submitting...' : (existingProposal ? 'Update Proposal' : 'Submit Proposal')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProposalForm

