import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import { 
  FaGraduationCap, 
  FaUser, 
  FaClock, 
  FaStar, 
  FaCalendarAlt,
  FaSpinner,
  FaPlus,
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaVideo,
  FaComments
} from 'react-icons/fa';

const Mentorship = () => {
  const { t } = useLanguage();
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [newRequest, setNewRequest] = useState({
    mentorId: '',
    title: '',
    description: '',
    category: '',
    skills: []
  });

  useEffect(() => {
    loadMentorships();
  }, [filterStatus, searchQuery]);

  const loadMentorships = async () => {
    setLoading(true);
    try {
      const params = {
        status: filterStatus,
        search: searchQuery,
        limit: 20
      };
      const response = await apiService.getMentorships(params);
      setMentorships(response.data.mentorships);
    } catch (error) {
      console.error('Error loading mentorships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await apiService.createMentorshipRequest(newRequest);
      setNewRequest({ mentorId: '', title: '', description: '', category: '', skills: [] });
      setShowCreateRequest(false);
      loadMentorships();
    } catch (error) {
      console.error('Error creating mentorship request:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedMentorship) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={() => setSelectedMentorship(null)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Mentorships
          </button>
          
          <div className="flex items-center space-x-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedMentorship.status)}`}>
              {selectedMentorship.status}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {selectedMentorship.category}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{selectedMentorship.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Mentor</h3>
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedMentorship.mentor.avatar || '/images/default-avatar.png'} 
                  alt="Mentor" 
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{selectedMentorship.mentor.firstName} {selectedMentorship.mentor.lastName}</p>
                  <p className="text-sm text-gray-600">{selectedMentorship.mentor.profile?.title}</p>
                  <p className="text-sm text-gray-500">{selectedMentorship.mentor.profile?.experience} years experience</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Mentee</h3>
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedMentorship.mentee.avatar || '/images/default-avatar.png'} 
                  alt="Mentee" 
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{selectedMentorship.mentee.firstName} {selectedMentorship.mentee.lastName}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700">{selectedMentorship.description}</p>
          </div>
          
          {selectedMentorship.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {selectedMentorship.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <FaCalendarAlt />
              <span>Started: {selectedMentorship.startDate ? formatDate(selectedMentorship.startDate) : 'Not started'}</span>
            </div>
            {selectedMentorship.endDate && (
              <div className="flex items-center space-x-2">
                <FaCalendarAlt />
                <span>Ends: {formatDate(selectedMentorship.endDate)}</span>
              </div>
            )}
            {selectedMentorship.rating && (
              <div className="flex items-center space-x-2">
                <FaStar className="text-yellow-500" />
                <span>{selectedMentorship.rating}/5</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Sessions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mentorship Sessions</h2>
          
          <div className="space-y-4">
            {selectedMentorship.sessions?.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{session.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{session.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt />
                    <span>{formatDate(session.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaClock />
                    <span>{session.duration} minutes</span>
                  </div>
                  {session.rating && (
                    <div className="flex items-center space-x-2">
                      <FaStar className="text-yellow-500" />
                      <span>{session.rating}/5</span>
                    </div>
                  )}
                </div>
                {session.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <h4 className="font-medium text-gray-800 mb-1">Notes</h4>
                    <p className="text-gray-600 text-sm">{session.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Mentorship Program</h1>
          <button
            onClick={() => setShowCreateRequest(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <FaPlus />
            <span>Find Mentor</span>
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mentorships..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Request Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Find a Mentor</h2>
            
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mentor ID</label>
                <input
                  type="text"
                  value={newRequest.mentorId}
                  onChange={(e) => setNewRequest({ ...newRequest, mentorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter mentor's user ID"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Learn React Development"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newRequest.category}
                  onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Business">Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={4}
                  placeholder="Describe what you want to learn and your goals..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRequest(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mentorships List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-4xl text-purple-500" />
          </div>
        ) : mentorships.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaGraduationCap className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No mentorships found</h3>
            <p className="text-gray-500">Start your learning journey by finding a mentor!</p>
          </div>
        ) : (
          mentorships.map((mentorship) => (
            <div key={mentorship.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedMentorship(mentorship)}>
              <div className="flex items-center space-x-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mentorship.status)}`}>
                  {mentorship.status}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {mentorship.category}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 mb-3 hover:text-purple-600">
                {mentorship.title}
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-2">{mentorship.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={mentorship.mentor.avatar || '/images/default-avatar.png'} 
                    alt="Mentor" 
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-800">Mentor: {mentorship.mentor.firstName} {mentorship.mentor.lastName}</p>
                    <p className="text-sm text-gray-600">{mentorship.mentor.profile?.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <img 
                    src={mentorship.mentee.avatar || '/images/default-avatar.png'} 
                    alt="Mentee" 
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-800">Mentee: {mentorship.mentee.firstName} {mentorship.mentee.lastName}</p>
                  </div>
                </div>
              </div>
              
              {mentorship.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {mentorship.skills.slice(0, 5).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                    {mentorship.skills.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{mentorship.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt />
                    <span>Started: {mentorship.startDate ? formatDate(mentorship.startDate) : 'Not started'}</span>
                  </div>
                  {mentorship.rating && (
                    <div className="flex items-center space-x-2">
                      <FaStar className="text-yellow-500" />
                      <span>{mentorship.rating}/5</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="text-gray-500 hover:text-blue-500">
                    <FaComments />
                  </button>
                  <button className="text-gray-500 hover:text-green-500">
                    <FaVideo />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Mentorship;


