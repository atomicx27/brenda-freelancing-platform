import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaStar, FaUserTie, FaBriefcase, FaDollarSign, FaFilter } from 'react-icons/fa';
import PropTypes from 'prop-types';
import apiService from '../../services/api';

const FindMentorModal = ({ isOpen, onClose, onRequestMentorship }) => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestData, setRequestData] = useState({
    title: '',
    description: '',
    category: '',
    skills: []
  });

  const categories = [
    'Web Development',
    'Mobile Development',
    'Design',
    'DevOps',
    'Data Science',
    'Machine Learning',
    'Cloud Computing',
    'Cybersecurity'
  ];

  useEffect(() => {
    if (isOpen) {
      loadMentors();
    }
  }, [isOpen]);

  const loadMentors = async () => {
    setLoading(true);
    try {
      // Fetch users with mentor profiles
      const response = await apiService.getPotentialMentors();
      setMentors(response.data?.mentors || []);
    } catch (error) {
      console.error('Error loading mentors:', error);
      // For now, use dummy data if API fails
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedMentor || !requestData.title.trim()) {
      alert('Please select a mentor and provide a title');
      return;
    }

    if (!requestData.description.trim() || requestData.description.trim().length < 50) {
      alert('Please write a personal message explaining why you want this mentor (minimum 50 characters)');
      return;
    }

    try {
      await onRequestMentorship({
        mentorId: selectedMentor.id,
        ...requestData
      });
      
      // Reset form
      setSelectedMentor(null);
      setRequestData({
        title: '',
        description: '',
        category: '',
        skills: []
      });
      onClose();
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send request';
      alert(errorMessage);
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = searchTerm === '' || 
      `${mentor.firstName} ${mentor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.profile?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      mentor.profile?.skills?.some(skill => skill.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Find a Mentor</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Side - Mentor List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search mentors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
              >
                <FaFilter />
                <span className="text-sm font-medium">
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </span>
              </button>

              {/* Filters */}
              {showFilters && (
                <div className="space-y-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Mentor List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading mentors...</div>
              ) : filteredMentors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No mentors found</div>
              ) : (
                filteredMentors.map(mentor => (
                  <div
                    key={mentor.id}
                    onClick={() => setSelectedMentor(mentor)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedMentor?.id === mentor.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {mentor.avatar ? (
                        <img
                          src={mentor.avatar}
                          alt={`${mentor.firstName} ${mentor.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <FaUserTie className="w-6 h-6 text-purple-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">
                            {mentor.firstName} {mentor.lastName}
                          </h3>
                          <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            ✓ Approved Mentor
                          </span>
                        </div>
                        {mentor.profile?.title && (
                          <p className="text-sm text-gray-600">{mentor.profile.title}</p>
                        )}
                        {mentor.mentorApplication?.experience && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                            <FaBriefcase className="w-3 h-3" />
                            <span>{mentor.mentorApplication.experience} years experience</span>
                          </div>
                        )}
                        {mentor.profile?.hourlyRate && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <FaDollarSign className="w-3 h-3" />
                            <span>${mentor.profile.hourlyRate}/hr</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Mentor Expertise from Application */}
                    {mentor.mentorApplication?.expertise && mentor.mentorApplication.expertise.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Expertise:</p>
                        <div className="flex flex-wrap gap-1">
                          {mentor.mentorApplication.expertise.slice(0, 3).map((area, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                            >
                              {area}
                            </span>
                          ))}
                          {mentor.mentorApplication.expertise.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{mentor.mentorApplication.expertise.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Achievements if available */}
                    {mentor.mentorApplication?.achievements && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {mentor.mentorApplication.achievements}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Request Form */}
          <div className="w-1/2 flex flex-col">
            {selectedMentor ? (
              <div className="flex-1 overflow-y-auto p-6">
                {/* Selected Mentor Info */}
                <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Requesting mentorship from:</h3>
                  <div className="flex items-center space-x-3">
                    {selectedMentor.avatar ? (
                      <img
                        src={selectedMentor.avatar}
                        alt={`${selectedMentor.firstName} ${selectedMentor.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center">
                        <FaUserTie className="w-8 h-8 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">
                        {selectedMentor.firstName} {selectedMentor.lastName}
                      </p>
                      {selectedMentor.profile?.title && (
                        <p className="text-sm text-gray-600">{selectedMentor.profile.title}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Request Form */}
                <div className="space-y-4">
                  {/* Personal Letter - Most Important Field */}
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Why do you want this mentor as your guide? *
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      Write a personal message explaining your goals and why this mentor is right for you (minimum 50 characters)
                    </p>
                    <textarea
                      value={requestData.description}
                      onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                      placeholder="I'm reaching out because I really admire your expertise in... I'm hoping to learn... I believe you'd be a great mentor for me because..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      required
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${requestData.description.length >= 50 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                        {requestData.description.length} / 50 characters
                      </span>
                      {requestData.description.length > 0 && requestData.description.length < 50 && (
                        <span className="text-xs text-amber-600">
                          {50 - requestData.description.length} more characters needed
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mentorship Title *
                    </label>
                    <input
                      type="text"
                      value={requestData.title}
                      onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                      placeholder="e.g., Full Stack Development Guidance"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={requestData.category}
                      onChange={(e) => setRequestData({ ...requestData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills to Learn (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={requestData.skills.join(', ')}
                      onChange={(e) => setRequestData({
                        ...requestData,
                        skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="React, Node.js, TypeScript..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={handleSendRequest}
                    className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Send Request
                  </button>
                  <button
                    onClick={() => setSelectedMentor(null)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FaUserTie className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Select a mentor to send a request</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

FindMentorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRequestMentorship: PropTypes.func.isRequired
};

export default FindMentorModal;
