import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HeadTag from '../components/HeadTag.jsx'
import Footer from '../components/Footer.jsx'
import ProposalForm from '../components/ProposalForm.jsx'
import ProposalCard from '../components/ProposalCard.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import apiService from '../services/api'
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaDollarSign, 
  FaUser, 
  FaCalendarAlt, 
  FaLaptop, 
  FaArrowLeft,
  FaPaperPlane,
  FaHeart,
  FaShare,
  FaUsers,
  FaTimes,
  FaEdit,
  FaTrash
} from 'react-icons/fa'

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [proposals, setProposals] = useState([])
  const [proposalsLoading, setProposalsLoading] = useState(false)
  const [userProposal, setUserProposal] = useState(null)
  const [submittingProposal, setSubmittingProposal] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null)

  // Calculate derived values
  const isOwner = isAuthenticated && user && job && job.owner && user.id === job.owner.id
  const canApply = isAuthenticated && user?.userType === 'FREELANCER' && !isOwner

  useEffect(() => {
    if (id) {
      loadJobDetails()
    }
  }, [id])

  useEffect(() => {
    if (id && isAuthenticated && user && job) {
      if (user.userType === 'FREELANCER') {
        checkUserProposal()
      }
      if (isOwner) {
        loadProposals()
      }
    }
  }, [id, isAuthenticated, user, job, isOwner])

  const loadJobDetails = async () => {
    try {
      setLoading(true)
      const response = await apiService.getJobById(id)
      setJob(response.data)
      
      // Load proposals if user is the job owner
      if (isAuthenticated && user?.id === response.data.ownerId) {
        loadProposals()
      }
    } catch (err) {
      setError('Failed to load job details')
      console.error('Error loading job:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProposals = async () => {
    if (!isAuthenticated || !isOwner) {
      return
    }
    
    try {
      setProposalsLoading(true)
      const response = await apiService.getJobProposals(id)
      setProposals(response.data)
    } catch (err) {
      console.error('Error loading proposals:', err)
    } finally {
      setProposalsLoading(false)
    }
  }

  const checkUserProposal = async () => {
    if (!isAuthenticated || user?.userType !== 'FREELANCER') {
      return
    }
    
    try {
      const response = await apiService.getUserProposals()
      const userProposalForThisJob = response.data.proposals.find(p => p.job.id === id)
      setUserProposal(userProposalForThisJob)
    } catch (err) {
      console.error('Error checking user proposal:', err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  const handleApplyJob = () => {
    if (!isAuthenticated) {
      navigate('/account-security/login')
      return
    }
    
    if (user.userType === 'CLIENT') {
      alert('Only freelancers can apply to jobs')
      return
    }
    
    if (userProposal) {
      alert('You have already submitted a proposal for this job')
      return
    }
    
    setShowProposalForm(true)
  }

  const handleSubmitProposal = async (proposalData) => {
    if (!isAuthenticated || user?.userType !== 'FREELANCER') {
      alert('Please log in as a freelancer to submit proposals')
      return
    }
    
    try {
      setSubmittingProposal(true)
      const response = await apiService.createProposal(proposalData)
      
      if (response.success) {
        setUserProposal(response.data)
        setShowProposalForm(false)
        alert('Proposal submitted successfully!')
      } else {
        alert(response.message || 'Failed to submit proposal')
      }
    } catch (err) {
      alert(err.message || 'Error submitting proposal')
      console.error('Error submitting proposal:', err)
    } finally {
      setSubmittingProposal(false)
    }
  }

  const handleUpdateProposalStatus = async (proposalId, status) => {
    if (!isAuthenticated || !isOwner) {
      alert('You must be the job owner to update proposal status')
      return
    }
    
    try {
      const response = await apiService.updateProposalStatus(proposalId, status)
      if (response.success) {
        // Update the proposal in the list
        setProposals(prev => prev.map(p => 
          p.id === proposalId ? { ...p, status } : p
        ))
        alert(`Proposal ${status.toLowerCase()} successfully`)
      } else {
        alert(response.message || 'Failed to update proposal')
      }
    } catch (err) {
      alert(err.message || 'Error updating proposal')
      console.error('Error updating proposal:', err)
    }
  }

  const handleSaveJob = () => {
    if (!isAuthenticated) {
      navigate('/account-security/login')
      return
    }
    // TODO: Implement save job functionality
    alert('Job saved! (Feature coming soon)')
  }

  const handleShareJob = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: job.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Job link copied to clipboard!')
    }
  }

  const handleWriteReview = (proposal) => {
    setReviewTarget({
      userId: proposal.author.id,
      userName: `${proposal.author.firstName} ${proposal.author.lastName}`,
      jobId: job.id,
      jobTitle: job.title
    })
    setShowReviewForm(true)
  }

  const handleSubmitReview = async (reviewData) => {
    try {
      await apiService.createReview(reviewData)
      setShowReviewForm(false)
      setReviewTarget(null)
      alert('Review submitted successfully!')
    } catch (err) {
      console.error('Error submitting review:', err)
      alert('Failed to submit review. Please try again.')
    }
  }

  const handleCancelReview = () => {
    setShowReviewForm(false)
    setReviewTarget(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/jobs/all-jobs')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Jobs
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title={`${job.title} - Brenda`}/>
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <FaArrowLeft />
          Back to Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <FaUser />
                      <span>{job.owner?.company?.companyName || `${job.owner?.firstName} ${job.owner?.lastName}`}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt />
                      <span>Posted {formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Company Logo */}
                {job.owner?.company?.logo && (
                  <img
                    src={job.owner.company.logo}
                    alt="Company logo"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
              </div>

              {/* Job Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{job._count?.proposals || 0}</div>
                  <div className="text-sm text-gray-600">Proposals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatBudget(job.budget, job.budgetType)}</div>
                  <div className="text-sm text-gray-600">Budget</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{job.duration || 'Not specified'}</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{job.category}</div>
                  <div className="text-sm text-gray-600">Category</div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Skills Required */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Required</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Proposals */}
            {isOwner && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaUsers />
                    Proposals ({proposals.length})
                  </h2>
                  <button
                    onClick={loadProposals}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Refresh
                  </button>
                </div>
                
                {proposalsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading proposals...</p>
                  </div>
                ) : proposals.length === 0 ? (
                  <div className="text-center py-8">
                    <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No proposals yet</p>
                    <p className="text-sm text-gray-500">Proposals will appear here when freelancers apply</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
                        <ProposalCard 
                          proposal={proposal} 
                          showActions={true}
                          onView={(proposal) => {
                            // TODO: Open proposal details modal
                            console.log('View proposal:', proposal)
                          }}
                        />
                        
                        {/* Action buttons for job owner */}
                        {proposal.status === 'PENDING' && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => handleUpdateProposalStatus(proposal.id, 'ACCEPTED')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Accept Proposal
                            </button>
                            <button
                              onClick={() => handleUpdateProposalStatus(proposal.id, 'REJECTED')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              Reject Proposal
                            </button>
                            <button
                              onClick={() => navigate(`/messages/${proposal.author.id}`)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              Message
                            </button>
                          </div>
                        )}

                        {/* Review button for accepted proposals */}
                        {proposal.status === 'ACCEPTED' && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => handleWriteReview(proposal)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Write Review
                            </button>
                            <button
                              onClick={() => navigate(`/messages/${proposal.author.id}`)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              Message
                            </button>
                            <button
                              onClick={() => navigate(`/reviews/user/${proposal.author.id}`)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              View Reviews
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User's Proposal Status */}
            {userProposal && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Proposal</h2>
                <ProposalCard proposal={userProposal} showJobInfo={false} />
              </div>
            )}

            {/* Proposal Form Modal */}
            {showProposalForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <ProposalForm
                    job={job}
                    onSubmit={handleSubmitProposal}
                    onCancel={() => setShowProposalForm(false)}
                    isLoading={submittingProposal}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-3">
                {!isAuthenticated && (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-600 mb-3">
                      Log in to apply for this job or manage your applications
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate('/account-security/login')}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => navigate('/account-security/signup')}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Debug information - remove this in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 text-sm">
                    <strong>Debug Info:</strong><br/>
                    isAuthenticated: {isAuthenticated ? 'true' : 'false'}<br/>
                    userType: {user?.userType || 'null'}<br/>
                    isOwner: {isOwner ? 'true' : 'false'}<br/>
                    canApply: {canApply ? 'true' : 'false'}<br/>
                    userProposal: {userProposal ? 'exists' : 'null'}
                  </div>
                )}

                {canApply && !userProposal && (
                  <button
                    onClick={handleApplyJob}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPaperPlane />
                    Apply to Job
                  </button>
                )}

                {/* Message button for authenticated users */}
                {isAuthenticated && !isOwner && (
                  <button
                    onClick={() => navigate(`/messages/${job.owner.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FaPaperPlane />
                    Message Client
                  </button>
                )}
                
                {userProposal && (
                  <div className="text-center py-3">
                    <div className="text-sm text-gray-600 mb-2">Your Proposal Status:</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userProposal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      userProposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      userProposal.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {userProposal.status}
                    </span>
                  </div>
                )}

                {/* Show different messages based on why apply button isn't showing */}
                {!canApply && isAuthenticated && user?.userType === 'CLIENT' && (
                  <div className="text-center py-3">
                    <div className="text-sm text-gray-600">
                      Only freelancers can apply to jobs. 
                      <button 
                        onClick={() => navigate('/account-security/signup')}
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        Switch to freelancer account
                      </button>
                    </div>
                  </div>
                )}

                {!canApply && isAuthenticated && isOwner && (
                  <div className="text-center py-3">
                    <div className="text-sm text-gray-600">
                      You cannot apply to your own job.
                    </div>
                  </div>
                )}

                {!canApply && !isAuthenticated && (
                  <div className="text-center py-3">
                    <div className="text-sm text-gray-600">
                      Please log in to apply to this job.
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleSaveJob}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaHeart />
                  Save Job
                </button>
                
                <button
                  onClick={handleShareJob}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaShare />
                  Share Job
                </button>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <FaDollarSign className="text-gray-400 w-4" />
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">{formatBudget(job.budget, job.budgetType)}</span>
                </div>
                
                {job.duration && (
                  <div className="flex items-center gap-3 text-sm">
                    <FaClock className="text-gray-400 w-4" />
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{job.duration}</span>
                  </div>
                )}
                
                {job.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <FaMapMarkerAlt className="text-gray-400 w-4" />
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                )}
                
                {job.isRemote && (
                  <div className="flex items-center gap-3 text-sm">
                    <FaLaptop className="text-gray-400 w-4" />
                    <span className="text-gray-600">Remote:</span>
                    <span className="font-medium text-green-600">Yes</span>
                  </div>
                )}
                
                {job.deadline && (
                  <div className="flex items-center gap-3 text-sm">
                    <FaCalendarAlt className="text-gray-400 w-4" />
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium">{formatDate(job.deadline)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info */}
            {job.owner?.company && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">About the Company</h3>
                  {canApply && userProposal?.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleWriteReview({
                        author: { id: job.owner.id, firstName: job.owner.firstName, lastName: job.owner.lastName }
                      })}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Review Client
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">{job.owner.company.companyName}</h4>
                  {job.owner.company.description && (
                    <p className="text-sm text-gray-600">{job.owner.company.description}</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/reviews/user/${job.owner.id}`)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                  >
                    View Client Reviews →
                  </button>
                </div>
              </div>
            )}

            {/* Job Management (for job owners) */}
            {isOwner && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Management</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/jobs/edit/${job.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaEdit />
                    Edit Job
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
                        try {
                          await apiService.deleteJob(job.id)
                          alert('Job deleted successfully')
                          navigate('/jobs/my-jobs')
                        } catch (err) {
                          alert('Failed to delete job: ' + (err.message || 'Unknown error'))
                          console.error('Error deleting job:', err)
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTrash />
                    Delete Job
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && reviewTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ReviewForm
              receiverId={reviewTarget.userId}
              receiverName={reviewTarget.userName}
              jobId={reviewTarget.jobId}
              jobTitle={reviewTarget.jobTitle}
              onSubmit={handleSubmitReview}
              onCancel={handleCancelReview}
            />
          </div>
        </div>
      )}
      
      <Footer/>
    </div>
  )
}
