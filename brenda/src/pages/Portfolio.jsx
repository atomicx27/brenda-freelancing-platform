import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import HeadTag from '../components/HeadTag.jsx'
import Footer from '../components/Footer.jsx'
import PortfolioItem from '../components/PortfolioItem.jsx'
import PortfolioForm from '../components/PortfolioForm.jsx'
import { FaPlus, FaFilter, FaSearch, FaSort } from 'react-icons/fa'
import apiService from '../services/api'

export default function Portfolio() {
  const { user, isAuthenticated } = useAuth()
  const [portfolioItems, setPortfolioItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showFeatured, setShowFeatured] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [categories, setCategories] = useState([])

  // Load portfolio items
  useEffect(() => {
    if (isAuthenticated) {
      loadPortfolioItems()
      loadCategories()
    }
  }, [isAuthenticated])

  const loadPortfolioItems = async () => {
    try {
      setLoading(true)
      const response = await apiService.getPortfolio()
      setPortfolioItems(response.data || [])
    } catch (err) {
      setError('Error loading portfolio items')
      console.error('Error loading portfolio:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await apiService.getPortfolioCategories()
      setCategories(response.data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const handleCreateItem = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this portfolio item?')) {
      return
    }

    try {
      await apiService.deletePortfolioItem(itemId)
      setPortfolioItems(prev => prev.filter(item => item.id !== itemId))
    } catch (err) {
      setError('Error deleting portfolio item')
      console.error('Error deleting item:', err)
    }
  }

  const handleToggleFeatured = async (itemId) => {
    try {
      const item = portfolioItems.find(i => i.id === itemId)
      await apiService.updatePortfolioItem(itemId, { featured: !item.featured })
      setPortfolioItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, featured: !item.featured }
            : item
        )
      )
    } catch (err) {
      setError('Error updating portfolio item')
      console.error('Error updating item:', err)
    }
  }

  const handleToggleVisibility = async (itemId) => {
    try {
      const item = portfolioItems.find(i => i.id === itemId)
      await apiService.updatePortfolioItem(itemId, { isPublic: !item.isPublic })
      setPortfolioItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, isPublic: !item.isPublic }
            : item
        )
      )
    } catch (err) {
      setError('Error updating portfolio item')
      console.error('Error updating item:', err)
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      
      let response
      if (editingItem) {
        response = await apiService.updatePortfolioItem(editingItem.id, formData)
        setPortfolioItems(prev => 
          prev.map(item => 
            item.id === editingItem.id ? response.data : item
          )
        )
      } else {
        response = await apiService.createPortfolioItem(formData)
        setPortfolioItems(prev => [response.data, ...prev])
      }
      
      setShowForm(false)
      setEditingItem(null)
    } catch (err) {
      setError('Error saving portfolio item')
      console.error('Error saving item:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  // Filter and sort portfolio items
  const filteredItems = portfolioItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    const matchesFeatured = !showFeatured || item.featured
    
    return matchesSearch && matchesCategory && matchesFeatured
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt)
      case 'title':
        return a.title.localeCompare(b.title)
      case 'category':
        return a.category.localeCompare(b.category)
      default:
        return 0
    }
  })

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your portfolio</h1>
          <a href="/account-security/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </div>
    )
  }

  if (user?.userType !== 'FREELANCER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Portfolio is only available for freelancers</h1>
          <a href="/profile" className="text-blue-600 hover:underline">Go to Profile</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeadTag title="Portfolio - Brenda"/>
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
              <p className="text-gray-600 mt-1">Showcase your work and attract clients</p>
            </div>
            <button
              onClick={handleCreateItem}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <FaPlus />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="category">Category</option>
            </select>

            {/* Featured Filter */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={showFeatured}
                onChange={(e) => setShowFeatured(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                Featured only
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Portfolio Items */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <FaPlus className="text-6xl mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || selectedCategory || showFeatured 
                ? 'No projects match your filters' 
                : 'No projects yet'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory || showFeatured
                ? 'Try adjusting your search or filters'
                : 'Start building your portfolio by adding your first project'
              }
            </p>
            {!searchTerm && !selectedCategory && !showFeatured && (
              <button
                onClick={handleCreateItem}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Add Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <PortfolioItem
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onToggleFeatured={handleToggleFeatured}
                onToggleVisibility={handleToggleVisibility}
                isOwner={true}
              />
            ))}
          </div>
        )}

        {/* Portfolio Form Modal */}
        {showForm && (
          <PortfolioForm
            item={editingItem}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        )}
      </div>

      <Footer />
    </div>
  )
}
