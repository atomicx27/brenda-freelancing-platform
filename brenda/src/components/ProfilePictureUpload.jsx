import React, { useState, useRef } from 'react'
import { FaCamera, FaTimes, FaUpload, FaSpinner } from 'react-icons/fa'
import fileUploadService from '../utils/fileUpload'

const ProfilePictureUpload = ({ 
  currentAvatar, 
  onUpload, 
  onError, 
  userId, 
  userName 
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (file) => {
    if (!file) return

    // Validate file
    if (!fileUploadService.validateImageFile(file)) {
      onError('Please select a valid image file (JPG, PNG, or GIF) under 5MB.')
      return
    }

    // Create preview
    const preview = fileUploadService.createPreviewUrl(file)
    setPreviewUrl(preview)

    // Upload file
    setIsUploading(true)
    try {
      const uploadedUrl = await fileUploadService.uploadProfilePicture(file, userId)
      onUpload(uploadedUrl)
      setPreviewUrl(null) // Clear preview after successful upload
    } catch (error) {
      onError(error.message || 'Upload failed. Please try again.')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    if (previewUrl) {
      fileUploadService.revokePreviewUrl(previewUrl)
      setPreviewUrl(null)
    }
    onUpload(null) // Remove avatar
  }

  const displayUrl = previewUrl || currentAvatar
  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : '?'

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Profile Picture Display */}
      <div className="relative">
        <div 
          className={`w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden cursor-pointer transition-all duration-200 ${
            dragActive ? 'border-blue-400 scale-105' : 'border-gray-200'
          } ${isUploading ? 'opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {initials}
              </span>
            </div>
          )}
          
          {/* Upload Overlay */}
          {!isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
              <FaCamera className="text-white text-2xl" />
            </div>
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <FaSpinner className="text-white text-2xl animate-spin" />
            </div>
          )}
        </div>

        {/* Remove Button */}
        {displayUrl && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemove()
            }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
          >
            <FaTimes className="text-sm" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center space-y-2">
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <FaUpload className="text-sm" />
          <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
        </button>
        
        <p className="text-xs text-gray-500 text-center">
          Drag & drop or click to upload
          <br />
          JPG, PNG, or GIF up to 5MB
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}

export default ProfilePictureUpload


