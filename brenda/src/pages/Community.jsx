import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import { 
  FaComments, 
  FaUsers, 
  FaGraduationCap, 
  FaBook, 
  FaQuestionCircle, 
  FaCalendarAlt, 
  FaHeart, 
  FaShare,
  FaSpinner,
  FaPlus,
  FaSearch,
  FaFilter
} from 'react-icons/fa';

const Community = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('forum');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    forumPosts: [],
    userGroups: [],
    mentorships: [],
    knowledgeArticles: [],
    faqs: [],
    events: []
  });

  useEffect(() => {
    loadCommunityData();
  }, [activeTab]);

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
      } else if (activeTab === 'knowledge') {
        promises.push(apiService.getKnowledgeArticles({ limit: 10 }));
        promises.push(apiService.getFAQs({ limit: 5 }));
      } else if (activeTab === 'events') {
        promises.push(apiService.getCommunityEvents({ limit: 10 }));
      }

      const results = await Promise.all(promises);
      
      if (activeTab === 'forum') {
        setData(prev => ({ ...prev, forumPosts: results[0]?.data?.posts || [] }));
      } else if (activeTab === 'groups') {
        setData(prev => ({ ...prev, userGroups: results[0]?.data?.groups || [] }));
      } else if (activeTab === 'mentorship') {
        setData(prev => ({ ...prev, mentorships: results[0]?.data?.mentorships || [] }));
      } else if (activeTab === 'knowledge') {
        setData(prev => ({ 
          ...prev, 
          knowledgeArticles: results[0]?.data?.articles || [],
          faqs: results[1]?.data?.faqs || []
        }));
      } else if (activeTab === 'events') {
        setData(prev => ({ ...prev, events: results[0]?.data?.events || [] }));
      }
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'forum', label: 'Forum', icon: FaComments, color: 'blue' },
    { id: 'groups', label: 'Groups', icon: FaUsers, color: 'green' },
    { id: 'mentorship', label: 'Mentorship', icon: FaGraduationCap, color: 'purple' },
    { id: 'knowledge', label: 'Knowledge Base', icon: FaBook, color: 'orange' },
    { id: 'events', label: 'Events', icon: FaCalendarAlt, color: 'red' }
  ];

  const renderForumContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Latest Forum Posts</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <FaPlus />
          <span>New Post</span>
        </button>
      </div>
      
      {data.forumPosts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">
              {post.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.category.color}`}>
              {post.category.name}
            </span>
          </div>
          <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>By {post.author.firstName} {post.author.lastName}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span>{post._count.comments} comments</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                <FaHeart />
                <span>{post._count.likes}</span>
              </button>
              <button className="text-gray-500 hover:text-blue-500">
                <FaShare />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGroupsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">User Groups</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
          <FaPlus />
          <span>Create Group</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.userGroups.map((group) => (
          <div key={group.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {group.coverImage && (
              <div className="h-32 bg-gradient-to-r from-green-400 to-blue-500"></div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{group.name}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{group.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{group._count.members} members</span>
                  <span>{group._count.posts} posts</span>
                </div>
                <button className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm">
                  Join
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMentorshipContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Mentorship Opportunities</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
          <FaPlus />
          <span>Find Mentor</span>
        </button>
      </div>
      
      {data.mentorships.map((mentorship) => (
        <div key={mentorship.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold text-gray-800">{mentorship.title}</h3>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
              {mentorship.status}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{mentorship.description}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={mentorship.mentor.avatar || '/images/default-avatar.png'} 
                  alt="Mentor" 
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-600">
                  Mentor: {mentorship.mentor.firstName} {mentorship.mentor.lastName}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <img 
                  src={mentorship.mentee.avatar || '/images/default-avatar.png'} 
                  alt="Mentee" 
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-600">
                  Mentee: {mentorship.mentee.firstName} {mentorship.mentee.lastName}
                </span>
              </div>
            </div>
            <button className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 text-sm">
              View Details
            </button>
          </div>
        </div>
      ))}
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
        return renderForumContent();
      case 'groups':
        return renderGroupsContent();
      case 'mentorship':
        return renderMentorshipContent();
      case 'knowledge':
        return renderKnowledgeContent();
      case 'events':
        return renderEventsContent();
      default:
        return renderForumContent();
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
    </div>
  );
};

export default Community;
