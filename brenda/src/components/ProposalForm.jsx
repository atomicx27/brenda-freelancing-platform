import React, { useState, useEffect } from 'react'
import { FaPaperPlane, FaDollarSign, FaClock, FaUser, FaTimes, FaMagic, FaChartLine } from 'react-icons/fa'
import AIEnhanceButton, { AIComparisonModal, AIAnalysisPanel } from './AIEnhanceButton'
import api from '../services/api'

const ProposalForm = ({ 
  job, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  existingProposal = null,
  minWords = 50,
  maxWords = 2000,
}) => {
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedRate: '',
    estimatedDuration: ''
  })
  const [errors, setErrors] = useState({})
  const [showComparison, setShowComparison] = useState(false)
  const [enhancedProposal, setEnhancedProposal] = useState('')
  const [originalProposal, setOriginalProposal] = useState('')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

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

  // AI Enhancement Functions
  const handleEnhanceProposal = async (enhanced) => {
    console.log('Enhanced proposal received:', enhanced)
    setOriginalProposal(formData.coverLetter)
    // The enhanced parameter is already the enhanced text string
    setEnhancedProposal(typeof enhanced === 'string' ? enhanced : enhanced.proposal || enhanced)
    setShowComparison(true)
  }

  const handleAcceptEnhanced = () => {
    console.log('Accepting enhanced proposal:', enhancedProposal)
    setFormData(prev => ({
      ...prev,
      coverLetter: enhancedProposal
    }))
    setShowComparison(false)
    console.log('Cover letter updated to:', enhancedProposal)
  }

  const handleRejectEnhanced = () => {
    setShowComparison(false)
  }

  const handleAnalyzeProposal = async () => {
    if (!formData.coverLetter || formData.coverLetter.trim().length < minWords) {
      setErrors(prev => ({
        ...prev,
        coverLetter: `Please write at least ${minWords} characters before analyzing`
      }))
      return
    }

    setLoadingAnalysis(true)
    setShowAnalysis(false)
    
    try {
      const result = await api.analyzeProposal({
        proposal: formData.coverLetter,
        jobTitle: job.title,
        jobDescription: job.description
      })

      console.log('Analysis Result:', result)

      if (result.data && result.data.analysis) {
        setAnalysisResult(result.data.analysis)
        setShowAnalysis(true)
      } else if (result.analysis) {
        setAnalysisResult(result.analysis)
        setShowAnalysis(true)
      }
    } catch (error) {
      console.error('Error analyzing proposal:', error)
      setErrors(prev => ({
        ...prev,
        analysis: error.message || 'Failed to analyze proposal. Please try again.'
      }))
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors = {}
    
    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required'
    } else if (formData.coverLetter.trim().length < minWords) {
      newErrors.coverLetter = `Cover letter must be at least ${minWords} characters`
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Cover Letter *
            </label>
            <div className="flex items-center gap-2">
              <AIEnhanceButton
                originalText={formData.coverLetter}
                onEnhanced={handleEnhanceProposal}
                enhanceFunction={(data) => api.enhanceProposal(data)}
                additionalData={{
                  jobTitle: job.title,
                  jobDescription: job.description,
                  // Use the same cover-letter limits enforced by this form
                  minWords,
                  maxWords
                }}
                buttonText="Enhance with AI"
                type="proposal"
              />
              <button
                type="button"
                onClick={handleAnalyzeProposal}
                disabled={loadingAnalysis || !formData.coverLetter || formData.coverLetter.trim().length < minWords}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <FaChartLine />
                {loadingAnalysis ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
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
              {formData.coverLetter.length}/{maxWords} characters
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

        {/* AI Analysis Panel */}
        {showAnalysis && analysisResult && (
          <AIAnalysisPanel
            analysis={analysisResult}
            onClose={() => setShowAnalysis(false)}
          />
        )}

        {errors.analysis && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.analysis}</p>
          </div>
        )}

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

      {/* AI Comparison Modal */}
      <AIComparisonModal
        original={originalProposal}
        enhanced={enhancedProposal}
        onAccept={handleAcceptEnhanced}
        onReject={handleRejectEnhanced}
        isOpen={showComparison}
      />
    </div>
  )
}

export default ProposalForm

