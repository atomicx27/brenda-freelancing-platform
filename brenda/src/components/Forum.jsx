import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import { 
  FaComments, 
  FaHeart, 
  FaShare, 
  FaReply, 
  FaEdit, 
  FaTrash, 
  FaPin, 
  FaLock,
  FaUser,
  FaClock,
  FaEye,
  FaSpinner,
  FaPlus,
  FaSearch,
  FaFilter
} from 'react-icons/fa';

const Forum = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    categoryId: '',
    tags: []
  });
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadCategories();
    loadPosts();
  }, [selectedCategory, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await apiService.getForumCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = {
        categoryId: selectedCategory,
        search: searchQuery,
        limit: 20
      };
      const response = await apiService.getForumPosts(params);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await apiService.createForumPost(newPost);
      setNewPost({ title: '', content: '', categoryId: '', tags: [] });
      setShowCreatePost(false);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleCreateComment = async (postId) => {
    if (!newComment.trim()) return;
    
    try {
      await apiService.createForumComment(postId, { content: newComment });
      setNewComment('');
      loadPosts();
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await apiService.likeContent({
        contentId: postId,
        contentType: 'FORUM_POST'
      });
      loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Post Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => setSelectedPost(null)}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Forum
            </button>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            {selectedPost.isPinned && <FaPin className="text-yellow-500" />}
            {selectedPost.isLocked && <FaLock className="text-red-500" />}
            <span className={`px-2 py-1 rounded-full text-xs font-medium`} style={{ backgroundColor: selectedPost.category.color + '20', color: selectedPost.category.color }}>
              {selectedPost.category.name}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{selectedPost.title}</h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-2">
              <FaUser />
              <span>{selectedPost.author.firstName} {selectedPost.author.lastName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaClock />
              <span>{formatDate(selectedPost.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaEye />
              <span>{selectedPost.viewCount} views</span>
            </div>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{selectedPost.content}</p>
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLikePost(selectedPost.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-red-500"
              >
                <FaHeart />
                <span>{selectedPost._count.likes}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                <FaShare />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Comments ({selectedPost._count.comments})
          </h2>
          
          {/* Add Comment */}
          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => handleCreateComment(selectedPost.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Post Comment
              </button>
            </div>
          </div>
          
          {/* Comments List */}
          <div className="space-y-4">
            {selectedPost.comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-blue-200 pl-4 py-2">
                <div className="flex items-center space-x-2 mb-2">
                  <FaUser className="text-gray-400" />
                  <span className="font-medium text-gray-800">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                    <FaHeart />
                    <span>{comment.likeCount}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
                    <FaReply />
                    <span>Reply</span>
                  </button>
                </div>
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
          <h1 className="text-3xl font-bold text-gray-800">Community Forum</h1>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FaPlus />
            <span>New Post</span>
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
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Post</h2>
            
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newPost.categoryId}
                  onChange={(e) => setNewPost({ ...newPost, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaComments className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts found</h3>
            <p className="text-gray-500">Be the first to start a discussion!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedPost(post)}>
              <div className="flex items-center space-x-2 mb-3">
                {post.isPinned && <FaPin className="text-yellow-500" />}
                {post.isLocked && <FaLock className="text-red-500" />}
                <span className={`px-2 py-1 rounded-full text-xs font-medium`} style={{ backgroundColor: post.category.color + '20', color: post.category.color }}>
                  {post.category.name}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 mb-3 hover:text-blue-600">
                {post.title}
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <FaUser />
                    <span>{post.author.firstName} {post.author.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaClock />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaComments />
                    <span>{post._count.comments}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikePost(post.id);
                    }}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
                  >
                    <FaHeart />
                    <span>{post._count.likes}</span>
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:text-blue-500"
                  >
                    <FaShare />
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

export default Forum;


