// File upload utility for Brenda frontend
import apiService, { apiConfig } from '../services/api';

class FileUploadService {
  constructor() {
    this.baseURL = apiConfig.origin;
  }

  // Upload profile picture
  async uploadProfilePicture(file, userId) {
    try {
      // Validate file
      if (!this.validateImageFile(file)) {
        throw new Error('Invalid file type. Please upload a JPG, PNG, or GIF image.');
      }

      // Upload file using API service
      const response = await apiService.uploadAvatar(file);
      return response.data.url;

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Validate image file
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  }

  // Get file size in human readable format
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Create preview URL for image
  createPreviewUrl(file) {
    return URL.createObjectURL(file);
  }

  // Revoke preview URL to free memory
  revokePreviewUrl(url) {
    URL.revokeObjectURL(url);
  }
}

// Create and export singleton instance
const fileUploadService = new FileUploadService();
export default fileUploadService;


