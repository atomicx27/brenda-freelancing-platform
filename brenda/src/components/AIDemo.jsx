import React, { useState } from 'react';
import { FaMagic, FaRocket, FaChartLine } from 'react-icons/fa';
import api from '../services/api';

/**
 * AI Features Demo Component
 * Quick demo to test all AI features in one place
 * 
 * Usage: Add to your routes for easy testing
 * <Route path="/ai-demo" element={<AIDemo />} />
 */
const AIDemo = () => {
  const [activeTab, setActiveTab] = useState('enhance-job');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Demo data
  const [jobData, setJobData] = useState({
    title: 'React Developer',
    description: 'Need someone to build a website with React',
    category: 'Web Development',
    skills: ['React', 'JavaScript']
  });

  const [proposalData, setProposalData] = useState({
    proposal: 'I can build this website for you. I have experience with React.',
    jobTitle: 'React Developer',
    jobDescription: 'Build a modern e-commerce website'
  });

  const testEnhanceJob = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await api.enhanceJobDescription(jobData);
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Failed to enhance job description');
    } finally {
      setLoading(false);
    }
  };

  const testEnhanceProposal = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await api.enhanceProposal(proposalData);
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Failed to enhance proposal');
    } finally {
      setLoading(false);
    }
  };

  const testJobSuggestions = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await api.generateJobSuggestions({
        title: jobData.title,
        category: jobData.category
      });
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const testAnalyzeProposal = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await api.analyzeProposal(proposalData);
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Failed to analyze proposal');
    } finally {
      setLoading(false);
    }
  };

  const testGenerateCoverLetter = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await api.generateCoverLetter({
        jobTitle: proposalData.jobTitle,
        jobDescription: proposalData.jobDescription,
        jobRequirements: 'React, Node.js, MongoDB',
        freelancerExperience: '5 years of full stack development'
      });
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FaRocket className="text-3xl text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Features Demo</h1>
          </div>
          <p className="text-gray-600">
            Test all AI-powered features in one place. Make sure you're logged in!
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'enhance-job', label: 'Enhance Job', icon: FaMagic },
              { id: 'enhance-proposal', label: 'Enhance Proposal', icon: FaMagic },
              { id: 'suggestions', label: 'Job Suggestions', icon: FaMagic },
              { id: 'analyze', label: 'Analyze Proposal', icon: FaChartLine },
              { id: 'cover-letter', label: 'Cover Letter', icon: FaMagic }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResult(null);
                  setError(null);
                }}
                className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Enhance Job Description */}
            {activeTab === 'enhance-job' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Enhance Job Description</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={jobData.title}
                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Job Title"
                  />
                  <textarea
                    value={jobData.description}
                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Job Description"
                  />
                  <button
                    onClick={testEnhanceJob}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Enhancing...' : 'Enhance Description'}
                  </button>
                </div>
              </div>
            )}

            {/* Enhance Proposal */}
            {activeTab === 'enhance-proposal' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Enhance Proposal</h2>
                <div className="space-y-3">
                  <textarea
                    value={proposalData.proposal}
                    onChange={(e) => setProposalData({ ...proposalData, proposal: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={6}
                    placeholder="Your Proposal"
                  />
                  <button
                    onClick={testEnhanceProposal}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Enhancing...' : 'Enhance Proposal'}
                  </button>
                </div>
              </div>
            )}

            {/* Job Suggestions */}
            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Get Job Suggestions</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={jobData.title}
                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Job Title"
                  />
                  <button
                    onClick={testJobSuggestions}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Getting Suggestions...' : 'Get Suggestions'}
                  </button>
                </div>
              </div>
            )}

            {/* Analyze Proposal */}
            {activeTab === 'analyze' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Analyze Proposal</h2>
                <div className="space-y-3">
                  <textarea
                    value={proposalData.proposal}
                    onChange={(e) => setProposalData({ ...proposalData, proposal: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={6}
                    placeholder="Proposal to Analyze"
                  />
                  <button
                    onClick={testAnalyzeProposal}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Proposal'}
                  </button>
                </div>
              </div>
            )}

            {/* Generate Cover Letter */}
            {activeTab === 'cover-letter' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Generate Cover Letter</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={proposalData.jobTitle}
                    onChange={(e) => setProposalData({ ...proposalData, jobTitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Job Title"
                  />
                  <textarea
                    value={proposalData.jobDescription}
                    onChange={(e) => setProposalData({ ...proposalData, jobDescription: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Job Description"
                  />
                  <button
                    onClick={testGenerateCoverLetter}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Generating...' : 'Generate Cover Letter'}
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium">❌ Error: {error}</p>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaMagic className="text-purple-600" />
                  AI Result
                </h3>
                <div className="space-y-4">
                  {/* Enhanced Description */}
                  {result.enhanced?.description && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Enhanced Description</h4>
                      <p className="text-gray-800 whitespace-pre-wrap bg-white p-4 rounded border border-gray-200">
                        {result.enhanced.description}
                      </p>
                    </div>
                  )}

                  {/* Enhanced Proposal */}
                  {result.enhanced?.proposal && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Enhanced Proposal</h4>
                      <p className="text-gray-800 whitespace-pre-wrap bg-white p-4 rounded border border-gray-200">
                        {result.enhanced.proposal}
                      </p>
                    </div>
                  )}

                  {/* Suggestions */}
                  {result.suggestions && (
                    <>
                      {result.suggestions.skills && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Suggested Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.suggestions.skills.map((skill, i) => (
                              <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.suggestions.description && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Suggested Description</h4>
                          <p className="text-gray-800 bg-white p-4 rounded border border-gray-200">
                            {result.suggestions.description}
                          </p>
                        </div>
                      )}
                      {result.suggestions.budget && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Suggested Budget</h4>
                          <p className="text-gray-800">
                            ${result.suggestions.budget.min} - ${result.suggestions.budget.max}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Analysis */}
                  {result.analysis && (
                    <>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Score</h4>
                        <div className="text-3xl font-bold text-purple-600">
                          {result.analysis.score}/100
                        </div>
                      </div>
                      {result.analysis.strengths && result.analysis.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">✅ Strengths</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {result.analysis.strengths.map((s, i) => (
                              <li key={i} className="text-gray-700">{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.analysis.improvements && result.analysis.improvements.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-orange-700 mb-2">💡 Improvements</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {result.analysis.improvements.map((i, idx) => (
                              <li key={idx} className="text-gray-700">{i}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.analysis.overallFeedback && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Overall Feedback</h4>
                          <p className="text-gray-800 bg-white p-4 rounded border border-gray-200">
                            {result.analysis.overallFeedback}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Cover Letter */}
                  {result.coverLetter && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Generated Cover Letter</h4>
                      <p className="text-gray-800 whitespace-pre-wrap bg-white p-4 rounded border border-gray-200">
                        {result.coverLetter}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Testing Tips</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Make sure you're logged in (AI endpoints require authentication)</li>
            <li>• GEMINI_API_KEY must be set in backend .env file</li>
            <li>• Backend server must be running on localhost:5000</li>
            <li>• Each AI request may take 2-5 seconds to process</li>
            <li>• Check browser console for any errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIDemo;
