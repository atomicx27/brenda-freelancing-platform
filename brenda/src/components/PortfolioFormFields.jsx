import React, { useState } from 'react'
import { FaPlus, FaTimes, FaCalendarAlt, FaTag, FaLink, FaGithub } from 'react-icons/fa'

const PortfolioFormFields = ({ 
  formData, 
  errors, 
  onChange, 
  onArrayChange 
}) => {
  const [newTag, setNewTag] = useState('')
  const [newTech, setNewTech] = useState('')

  // Predefined categories
  const categories = [
    'Web Development',
    'Mobile App Development',
    'UI/UX Design',
    'Graphic Design',
    'Writing & Content',
    'Marketing',
    'Data Analysis',
    'Machine Learning',
    'DevOps',
    'Other'
  ]

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      onArrayChange('tags', [...formData.tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    onArrayChange('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  const handleAddTech = () => {
    if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
      onArrayChange('technologies', [...formData.technologies, newTech.trim()])
      setNewTech('')
    }
  }

  const handleRemoveTech = (techToRemove) => {
    onArrayChange('technologies', formData.technologies.filter(tech => tech !== techToRemove))
  }

  return (
    <>
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter project title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.category ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your project, what you built, and the challenges you solved..."
        />
      </div>

      {/* Technologies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technologies Used
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newTech}
            onChange={(e) => setNewTech(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTech()
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add technology (e.g., React, Node.js)"
          />
          <button
            type="button"
            onClick={handleAddTech}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            <FaPlus />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.technologies.map((tech, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              <FaTag className="mr-1 text-xs" />
              {tech}
              <button
                type="button"
                onClick={() => handleRemoveTech(tech)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <FaTimes className="text-xs" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add tag (e.g., e-commerce, responsive)"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            <FaPlus />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 text-gray-600 hover:text-gray-800"
              >
                <FaTimes className="text-xs" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCalendarAlt className="inline mr-1" />
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCalendarAlt className="inline mr-1" />
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={onChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.endDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* URLs */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaLink className="inline mr-1" />
            Live URL
          </label>
          <input
            type="url"
            name="liveUrl"
            value={formData.liveUrl}
            onChange={onChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.liveUrl ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://your-project.com"
          />
          {errors.liveUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.liveUrl}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaGithub className="inline mr-1" />
            GitHub URL
          </label>
          <input
            type="url"
            name="githubUrl"
            value={formData.githubUrl}
            onChange={onChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.githubUrl ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://github.com/username/project"
          />
          {errors.githubUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.githubUrl}</p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isPublic"
            checked={formData.isPublic}
            onChange={onChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Make this project public
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="featured"
            checked={formData.featured}
            onChange={onChange}
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Feature this project
          </label>
        </div>
      </div>
    </>
  )
}

export default PortfolioFormFields
