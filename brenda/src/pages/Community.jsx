import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { 
  FaComments, 
  FaUsers, 
  FaGraduationCap, 
  FaSpinner,
  FaPlus,
  FaTrash
} from 'react-icons/fa';

import Forum from '../components/Forum.jsx';
import CreateGroupModal from '../components/Groups/CreateGroupModal';
import GroupCard from '../components/Groups/GroupCard';
import MentorshipCard from '../components/Mentorship/MentorshipCard';
import FindMentorModal from '../components/Mentorship/FindMentorModal';
import BecomeMentorModal from '../components/Mentorship/BecomeMentorModal';

const Community = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('forum');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    forumPosts: [],
    userGroups: [],
    mentorships: []
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [findMentorModalOpen, setFindMentorModalOpen] = useState(false);
  const [becomeMentorModalOpen, setBecomeMentorModalOpen] = useState(false);
  const [mentorApplication, setMentorApplication] = useState(null);
  const [mentorshipFilter, setMentorshipFilter] = useState('all'); // 'all', 'incoming', 'outgoing', 'active'

  useEffect(() => {
    loadCommunityData();
    if (activeTab === 'mentorship') {
      loadMentorApplication();
    }
  }, [activeTab]);

  const loadMentorApplication = async () => {
    try {
      const response = await apiService.getMyMentorApplication();
      setMentorApplication(response.data?.application);
    } catch (error) {
      console.error('Error loading mentor application:', error);
    }
  };

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      const promises = [];
      
      if (activeTab === 'forum') {
        promises.push(apiService.getForumPosts({ limit: 10 }));
      } else if (activeTab === 'groups') {
        promises.push(apiService.getUserGroups({ limit: 10 }));
      } else if (activeTab === 'mentorship') {
        promises.push(apiService.getMentorships({ limit: 10 }));
      }

      const results = await Promise.all(promises);
      
      if (activeTab === 'forum') {
        setData(prev => ({ ...prev, forumPosts: results[0]?.data?.posts || [] }));
      } else if (activeTab === 'groups') {
        setData(prev => ({ ...prev, userGroups: results[0]?.data?.groups || [] }));
      } else if (activeTab === 'mentorship') {
        console.log('📊 Mentorship API Response:', results[0]);
        console.log('📊 Mentorships Data:', results[0]?.data?.mentorships);
        setData(prev => ({ ...prev, mentorships: results[0]?.data?.mentorships || [] }));
      }
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mentorship handlers
  const handleRequestMentorship = async (data) => {
    try {
      const response = await apiService.createMentorshipRequest(data);
      if (response.data?.mentorship) {
        setData(prev => ({ ...prev, mentorships: [response.data.mentorship, ...prev.mentorships] }));
      }
      await loadCommunityData(); // Reload to get updated list
    } catch (error) {
      console.error('Error requesting mentorship:', error);
      throw error;
    }
  };

  const handleAcceptMentorship = async (id) => {
    try {
      const response = await apiService.acceptMentorshipRequest(id);
      if (response.data?.mentorship) {
        setData(prev => ({
          ...prev,
          mentorships: prev.mentorships.map(m => 
            m.id === id ? response.data.mentorship : m
          )
        }));
      }
    } catch (error) {
      console.error('Error accepting mentorship:', error);
      alert('Failed to accept mentorship request');
    }
  };

  const handleRejectMentorship = async (id) => {
    // Confirm before rejecting
    if (!window.confirm('Are you sure you want to reject this mentorship request? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.rejectMentorshipRequest(id);
      // Remove the rejected mentorship from the list
      setData(prev => ({
        ...prev,
        mentorships: prev.mentorships.filter(m => m.id !== id)
      }));
      alert('Mentorship request rejected and removed');
    } catch (error) {
      console.error('Error rejecting mentorship:', error);
      alert('Failed to reject mentorship request');
    }
  };

  const handleViewMentorshipDetails = (id) => {
    // TODO: Navigate to mentorship detail page or open modal
    console.log('View mentorship details:', id);
    // For now, just log it
  };

  // Mentor application handlers
  const handleBecomeMentor = () => {
    setBecomeMentorModalOpen(true);
  };

  const handleSubmitMentorApplication = async (formData) => {
    try {
      const response = await apiService.submitMentorApplication(formData);
      if (response.data?.application) {
        setMentorApplication(response.data.application);
        setBecomeMentorModalOpen(false);
        alert('Mentor application submitted successfully! We will review it soon.');
      }
    } catch (error) {
      console.error('Error submitting mentor application:', error);
      alert(error.message || 'Failed to submit application. Please try again.');
    }
  };

  const tabs = [
    { id: 'forum', label: 'Forum', icon: FaComments, color: 'blue' },
    { id: 'groups', label: 'Groups', icon: FaUsers, color: 'green' },
    { id: 'mentorship', label: 'Mentorship', icon: FaGraduationCap, color: 'purple' }
  ];

  const handleDeleteForumPost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await apiService.deleteForumPost(postId);
      setData(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.filter(p => p.id !== postId)
      }));
      alert('Post deleted successfully');
    } catch (err) {
      console.error('Failed to delete post', err);
      alert(err?.message || 'Failed to delete post');
    }
  };

  const renderForumContent = () => {
    console.log('User:', user);
    console.log('Forum posts:', data.forumPosts);
    
    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Latest Forum Posts</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <FaPlus />
          <span>New Post</span>
        </button>
      </div>
      
      {data.forumPosts.map((post) => {
        const isOwner = user && post.authorId === user.id;
        console.log(`Post ${post.id}: authorId=${post.authorId}, userId=${user?.id}, isOwner=${isOwner}`);
        
        return (
        <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">
              {post.title}
            </h3>
            <div className="flex items-center space-x-2">
              {post.category && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.category.color || 'bg-blue-100 text-blue-800'}`}>
                  {post.category.name}
                </span>
              )}
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteForumPost(post.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete post"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>By {post.author?.firstName || 'Unknown'} {post.author?.lastName || ''}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span>{post._count?.comments || 0} comments</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                <FaHeart />
                <span>{post._count?.likes || 0}</span>
              </button>
              <button className="text-gray-500 hover:text-blue-500">
                <FaShare />
              </button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
    );
  };

  const renderGroupsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">User Groups</h2>
        <button onClick={() => setCreateModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
          <FaPlus />
          <span>Create Group</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.userGroups.map((group) => (
          <GroupCard 
            key={group.id} 
            group={group} 
            onJoined={(id) => {
              // increment member count locally for quick feedback
              setData(prev => ({
                ...prev,
                userGroups: prev.userGroups.map(g => g.id === id ? { ...g, _count: { ...(g._count || {}), members: (g._count?.members || 0) + 1 } } : g)
              }));
            }}
            onDeleted={(id) => {
              // remove group from list
              setData(prev => ({
                ...prev,
                userGroups: prev.userGroups.filter(g => g.id !== id)
              }));
            }}
          />
        ))}
      </div>
      <CreateGroupModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={async (payload) => {
        try {
          const res = await apiService.createUserGroup(payload);
          const newGroup = res?.data?.group || res?.data || null;
          if (newGroup) {
            setData(prev => ({ ...prev, userGroups: [newGroup, ...prev.userGroups] }));
          }
        } catch (err) {
          console.error('Failed to create group', err);
        }
      }} />
    </div>
  );

  const renderMentorshipContent = () => (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Mentorship Opportunities</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Become a Mentor button */}
          <button 
            onClick={handleBecomeMentor}
            className={`px-6 py-2.5 rounded-lg flex items-center justify-center space-x-2 font-medium shadow-md hover:shadow-lg transition-all ${
              mentorApplication?.status === 'APPROVED' 
                ? 'bg-green-600 text-white cursor-not-allowed opacity-75' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            disabled={mentorApplication?.status === 'APPROVED'}
          >
            <FaGraduationCap className="text-lg" />
            <span>
              {mentorApplication?.status === 'PENDING' ? 'Application Pending' : 
               mentorApplication?.status === 'REJECTED' ? 'Reapply as Mentor' :
               mentorApplication?.status === 'APPROVED' ? 'Approved Mentor ✓' :
               'Become a Mentor'}
            </span>
          </button>
          {/* Find Mentor button */}
          <button 
            onClick={() => setFindMentorModalOpen(true)}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 font-medium shadow-md hover:shadow-lg transition-all"
          >
            <FaPlus className="text-lg" />
            <span>Find Mentor</span>
          </button>
        </div>
      </div>

      {/* Application Status Banner */}
      {mentorApplication && (
        <div className={`p-4 rounded-lg border-l-4 ${
          mentorApplication.status === 'PENDING' ? 'bg-yellow-50 border-yellow-500' :
          mentorApplication.status === 'APPROVED' ? 'bg-green-50 border-green-500' :
          'bg-red-50 border-red-500'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">
                {mentorApplication.status === 'PENDING' && 'Mentor Application Under Review'}
                {mentorApplication.status === 'APPROVED' && 'You are an Approved Mentor! 🎉'}
                {mentorApplication.status === 'REJECTED' && 'Application Not Approved'}
              </h3>
              <p className="text-sm text-gray-600">
                {mentorApplication.status === 'PENDING' && 'Your application is being reviewed by our team. You will be notified once a decision is made.'}
                {mentorApplication.status === 'APPROVED' && 'You can now accept mentorship requests from users on the platform.'}
                {mentorApplication.status === 'REJECTED' && mentorApplication.adminNotes && `Reason: ${mentorApplication.adminNotes}`}
              </p>
            </div>
            {mentorApplication.status === 'PENDING' && (
              <button
                onClick={handleBecomeMentor}
                className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
              >
                View/Edit
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Mentorship Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-2 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              console.log('🔍 All mentorships:', data.mentorships);
              console.log('🔍 User ID:', user?.id);
              setMentorshipFilter('all');
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mentorshipFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({data.mentorships.length})
          </button>
          <button
            onClick={() => {
              const incoming = data.mentorships.filter(m => m.mentorId === user?.id && m.status === 'PENDING');
              console.log('📥 Incoming requests:', incoming);
              setMentorshipFilter('incoming');
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mentorshipFilter === 'incoming'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Incoming Requests ({data.mentorships.filter(m => m.mentorId === user?.id && m.status === 'PENDING').length})
          </button>
          <button
            onClick={() => {
              const outgoing = data.mentorships.filter(m => m.menteeId === user?.id && m.status === 'PENDING');
              console.log('📤 Outgoing requests:', outgoing);
              setMentorshipFilter('outgoing');
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mentorshipFilter === 'outgoing'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sent Requests ({data.mentorships.filter(m => m.menteeId === user?.id && m.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setMentorshipFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mentorshipFilter === 'active'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({data.mentorships.filter(m => m.status === 'ACTIVE').length})
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-4xl text-purple-600" />
        </div>
      ) : data.mentorships.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaGraduationCap className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No mentorship opportunities yet</p>
          <button 
            onClick={() => setFindMentorModalOpen(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Find a Mentor
          </button>
        </div>
      ) : (() => {
        // Filter mentorships based on selected filter
        let filteredMentorships = data.mentorships;
        
        if (mentorshipFilter === 'incoming') {
          filteredMentorships = data.mentorships.filter(
            m => m.mentorId === user?.id && m.status === 'PENDING'
          );
        } else if (mentorshipFilter === 'outgoing') {
          filteredMentorships = data.mentorships.filter(
            m => m.menteeId === user?.id && m.status === 'PENDING'
          );
        } else if (mentorshipFilter === 'active') {
          filteredMentorships = data.mentorships.filter(m => m.status === 'ACTIVE');
        }
        
        if (filteredMentorships.length === 0) {
          return (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <FaGraduationCap className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {mentorshipFilter === 'incoming' && 'No incoming mentorship requests'}
                {mentorshipFilter === 'outgoing' && 'No pending requests sent'}
                {mentorshipFilter === 'active' && 'No active mentorships'}
                {mentorshipFilter === 'all' && 'No mentorship opportunities yet'}
              </p>
              <button 
                onClick={() => setFindMentorModalOpen(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Find a Mentor
              </button>
            </div>
          );
        }
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMentorships.map((mentorship) => (
              <MentorshipCard
                key={mentorship.id}
                mentorship={mentorship}
                currentUserId={user?.id || ''}
                onAccept={handleAcceptMentorship}
                onReject={handleRejectMentorship}
                onViewDetails={handleViewMentorshipDetails}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );

  const renderKnowledgeContent = () => (
    <div className="space-y-8">
      {/* Knowledge Articles */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Knowledge Articles</h2>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
            <FaPlus />
            <span>Write Article</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.knowledgeArticles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{article.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-3">{article.content}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>By {article.author.firstName} {article.author.lastName}</span>
                  <span>{article.viewCount} views</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                    <FaHeart />
                    <span>{article.likeCount}</span>
                  </button>
                  <button className="text-gray-500 hover:text-blue-500">
                    <FaShare />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {data.faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEventsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Community Events</h2>
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2">
          <FaPlus />
          <span>Create Event</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {event.image && (
              <div className="h-48 bg-gradient-to-r from-red-400 to-pink-500"></div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {event.eventType}
                </span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                  <span>{event.isOnline ? 'Online' : event.location}</span>
                  <span>{event._count.attendees} attendees</span>
                </div>
                <button className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm">
                  Join Event
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      );
    }

    switch (activeTab) {
      case 'forum':
        return <Forum />;
      case 'groups':
        return renderGroupsContent();
      case 'mentorship':
        return renderMentorshipContent();
      default:
        return <Forum />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Community Hub
          </h1>
          <p className="text-lg text-gray-600">
            Connect, learn, and grow with the Brenda community
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="flex flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? `bg-${tab.color}-600 text-white`
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
      <FindMentorModal
        isOpen={findMentorModalOpen}
        onClose={() => setFindMentorModalOpen(false)}
        onRequestMentorship={handleRequestMentorship}
      />
      
      <BecomeMentorModal
        isOpen={becomeMentorModalOpen}
        onClose={() => setBecomeMentorModalOpen(false)}
        onSubmit={handleSubmitMentorApplication}
        existingApplication={mentorApplication}
      />
    </div>
  );
};

export default Community;
