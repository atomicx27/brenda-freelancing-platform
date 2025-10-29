// API service layer for Brenda frontend
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If there are validation errors, include them in the error message
        if (data.errors && typeof data.errors === 'object') {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          throw new Error(`${data.message || 'Validation failed'}: ${errorMessages}`);
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication APIs
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token after successful login
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    // Clear token after logout
    this.clearToken();
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // User Profile APIs
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Portfolio APIs
  async getPortfolio() {
    return this.request('/portfolio');
  }

  async getPortfolioItem(id) {
    return this.request(`/portfolio/${id}`);
  }

  async createPortfolioItem(itemData) {
    return this.request('/portfolio', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updatePortfolioItem(id, itemData) {
    return this.request(`/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deletePortfolioItem(id) {
    return this.request(`/portfolio/${id}`, {
      method: 'DELETE',
    });
  }

  async getPortfolioCategories() {
    return this.request('/portfolio/categories');
  }

  // Public Portfolio APIs (no authentication required)
  async getUserPublicPortfolio(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/portfolio/public/user/${userId}${queryString ? `?${queryString}` : ''}`;
    return this.request(url);
  }

  async getPublicPortfolioItem(itemId) {
    return this.request(`/portfolio/public/item/${itemId}`);
  }

  // Browse & Discovery APIs
  async browsePortfolio(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/portfolio/browse${queryString ? `?${queryString}` : ''}`;
    return this.request(url);
  }

  async getFeaturedPortfolio(limit = 10) {
    return this.request(`/portfolio/featured?limit=${limit}`);
  }

  async searchPortfolio(query, params = {}) {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return this.request(`/portfolio/search?${searchParams.toString()}`);
  }

  // Portfolio Interactions
  async trackPortfolioView(itemId) {
    return this.request(`/portfolio/${itemId}/view`, {
      method: 'POST',
    });
  }

  async togglePortfolioLike(itemId) {
    return this.request(`/portfolio/${itemId}/like`, {
      method: 'POST',
    });
  }

  // Portfolio Statistics
  async getPortfolioStats() {
    return this.request('/portfolio/stats/overview');
  }

  async getPortfolioItemStats(itemId) {
    return this.request(`/portfolio/${itemId}/stats`);
  }

  // Bulk Operations
  async bulkUpdatePortfolio(itemIds, updates) {
    return this.request('/portfolio/bulk/update', {
      method: 'POST',
      body: JSON.stringify({ itemIds, updates }),
    });
  }

  async reorderPortfolio(itemOrders) {
    return this.request('/portfolio/bulk/reorder', {
      method: 'POST',
      body: JSON.stringify({ itemOrders }),
    });
  }

  // Company Profile APIs
  async getCompanyProfile() {
    return this.request('/company/profile');
  }

  async updateCompanyProfile(profileData) {
    return this.request('/company/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getCompanyStats() {
    return this.request('/company/stats');
  }

  async getPublicCompanyProfiles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/company/public${queryString ? `?${queryString}` : ''}`);
  }

  async getCompanyProfileById(id) {
    return this.request(`/company/public/${id}`);
  }

  async getCompanyIndustries() {
    return this.request('/company/industries');
  }

  // File Upload APIs
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/upload/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json();
  }

  async removeAvatar() {
    return this.request('/upload/avatar', {
      method: 'DELETE',
    });
  }

  // Job APIs
  async getAllJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async getTodaysJobs() {
    return this.request('/jobs/todays');
  }

  async getJobById(id) {
    return this.request(`/jobs/${id}`);
  }

  async getUserJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/jobs/my/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async createJob(jobData) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id, jobData) {
    return this.request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id) {
    return this.request(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async getJobCategories() {
    return this.request('/jobs/categories');
  }

  async getPopularSkills() {
    return this.request('/jobs/popular-skills');
  }

  // Proposal APIs
  async createProposal(proposalData) {
    return this.request('/proposals', {
      method: 'POST',
      body: JSON.stringify(proposalData),
    });
  }

  async getUserProposals(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/proposals/my-proposals${queryString ? `?${queryString}` : ''}`);
  }

  async getProposalById(id) {
    return this.request(`/proposals/${id}`);
  }

  async updateProposal(id, proposalData) {
    return this.request(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proposalData),
    });
  }

  async deleteProposal(id) {
    return this.request(`/proposals/${id}`, {
      method: 'DELETE',
    });
  }

  async getJobProposals(jobId) {
    return this.request(`/proposals/job/${jobId}`);
  }

  async updateProposalStatus(id, status) {
    return this.request(`/proposals/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getProposalStats() {
    return this.request('/proposals/stats');
  }

  // Message APIs
  async sendMessage(messageData) {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getConversation(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/messages/conversation/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  async getConversations() {
    return this.request('/messages/conversations');
  }

  async markMessagesAsRead(messageIds) {
    return this.request('/messages/mark-read', {
      method: 'PATCH',
      body: JSON.stringify({ messageIds }),
    });
  }

  async searchMessages(query, params = {}) {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return this.request(`/messages/search?${searchParams}`);
  }

  async getUnreadCount() {
    return this.request('/messages/unread-count');
  }

  async deleteMessage(messageId) {
    return this.request(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // Review APIs
  async createReview(reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getUserReviews(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reviews/user/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  async getUserAuthoredReviews(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reviews/my-reviews${queryString ? `?${queryString}` : ''}`);
  }

  async updateReview(reviewId, reviewData) {
    return this.request(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  async deleteReview(reviewId) {
    return this.request(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  async getRecentReviews(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reviews/recent${queryString ? `?${queryString}` : ''}`);
  }

  async reportReview(reviewId, reportData) {
    return this.request(`/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  // Analytics APIs
  async getFreelancerAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/freelancer${queryString ? `?${queryString}` : ''}`);
  }

  async getClientAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/client${queryString ? `?${queryString}` : ''}`);
  }

  async getAdminAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/admin${queryString ? `?${queryString}` : ''}`);
  }

  async getPlatformHealth() {
    return this.request('/analytics/health');
  }

  // Admin APIs
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUserDetails(userId) {
    return this.request(`/admin/users/${userId}`);
  }

  async updateUserStatus(userId, action, reason = '') {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    });
  }

  async getContentForModeration(type, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/moderation/${type}${queryString ? `?${queryString}` : ''}`);
  }

  async moderateContent(contentId, type, action, reason = '') {
    return this.request(`/admin/moderation/${contentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ type, action, reason }),
    });
  }

  async getSystemHealth() {
    return this.request('/admin/system/health');
  }

  async getSystemLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/system/logs${queryString ? `?${queryString}` : ''}`);
  }

  async createBackup() {
    return this.request('/admin/backup/create', {
      method: 'POST',
    });
  }

  // Advanced Search APIs
  async advancedJobSearch(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/search/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async advancedFreelancerSearch(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/search/freelancers${queryString ? `?${queryString}` : ''}`);
  }

  async getSearchFilters() {
    return this.request('/search/filters');
  }

  async saveSearchPreferences(preferences) {
    return this.request('/search/preferences', {
      method: 'POST',
      body: JSON.stringify({ preferences }),
    });
  }

  async getSearchPreferences() {
    return this.request('/search/preferences');
  }

  // Community APIs
  // Forum APIs
  async getForumCategories() {
    return this.request('/community/forum/categories');
  }

  async getForumPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/forum/posts${queryString ? `?${queryString}` : ''}`);
  }

  async getForumPost(postId) {
    return this.request(`/community/forum/posts/${postId}`);
  }

  async createForumPost(data) {
    return this.request('/community/forum/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createForumComment(postId, data) {
    return this.request(`/community/forum/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User Groups APIs
  async getUserGroups(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/groups${queryString ? `?${queryString}` : ''}`);
  }

  async createUserGroup(data) {
    return this.request('/community/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinUserGroup(groupId) {
    return this.request(`/community/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  // Mentorship APIs
  async getMentorships(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/mentorships${queryString ? `?${queryString}` : ''}`);
  }

  async createMentorshipRequest(data) {
    return this.request('/community/mentorships', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Knowledge Base APIs
  async getKnowledgeArticles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/knowledge/articles${queryString ? `?${queryString}` : ''}`);
  }

  async getFAQs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/knowledge/faqs${queryString ? `?${queryString}` : ''}`);
  }

  // Community Events APIs
  async getCommunityEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/events${queryString ? `?${queryString}` : ''}`);
  }

  async joinCommunityEvent(eventId) {
    return this.request(`/community/events/${eventId}/join`, {
      method: 'POST',
    });
  }

  // Social Features APIs
  async likeContent(data) {
    return this.request('/community/social/like', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserConnections() {
    return this.request('/community/social/connections');
  }

  async sendConnectionRequest(data) {
    return this.request('/community/social/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Automation APIs
  // Automation Rules APIs
  async getAutomationRules(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/automation/rules${queryString ? `?${queryString}` : ''}`);
  }

  async createAutomationRule(data) {
    return this.request('/automation/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async executeAutomationRule(ruleId) {
    return this.request(`/automation/rules/${ruleId}/execute`, {
      method: 'POST',
    });
  }

  // Smart Contracts APIs
  async getSmartContracts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/automation/contracts${queryString ? `?${queryString}` : ''}`);
  }

  async generateSmartContract(data) {
    return this.request('/automation/contracts/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Automated Invoicing APIs
  async getInvoices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/automation/invoices${queryString ? `?${queryString}` : ''}`);
  }

  async generateInvoice(data) {
    return this.request('/automation/invoices/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Email Marketing APIs
  async getEmailCampaigns(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/automation/email-campaigns${queryString ? `?${queryString}` : ''}`);
  }

  async createEmailCampaign(data) {
    return this.request('/automation/email-campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Lead Scoring APIs
  async getLeadScores(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/automation/lead-scores${queryString ? `?${queryString}` : ''}`);
  }

  async calculateLeadScore(data) {
    return this.request('/automation/lead-scores/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Follow-up Automation APIs
  async getFollowUpRules(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/automation/follow-up-rules${queryString ? `?${queryString}` : ''}`);
  }

  async createFollowUpRule(data) {
    return this.request('/automation/follow-up-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Deadline Reminders APIs
  async getReminders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/automation/reminders${queryString ? `?${queryString}` : ''}`);
  }

  async createReminder(data) {
    return this.request('/automation/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Status Update Automation APIs
  async getStatusUpdateRules(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/automation/status-update-rules${queryString ? `?${queryString}` : ''}`);
  }

  async createStatusUpdateRule(data) {
    return this.request('/automation/status-update-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Email test endpoint (Resend)
  async sendTestEmail({ to, subject, html }) {
    return this.request('/email/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, html })
    });
  }

  // Health check
  async healthCheck() {
    return fetch('http://localhost:5000/health').then(res => res.json());
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;



