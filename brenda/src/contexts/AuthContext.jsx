import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await apiService.getCurrentUser();
          setUser(userData.data);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        apiService.clearToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiService.login(credentials);
      setUser(response.user);
      
      return { success: true, data: response };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiService.register(userData);
      
      // Auto-login after successful registration
      if (response.token) {
        setUser(response.user);
      }
      
      return { success: true, data: response };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiService.updateUserProfile(profileData);
      
      // Update user state with new data
      setUser(prevUser => ({
        ...prevUser,
        ...response.data
      }));
      
      return { success: true, data: response };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!user,
    isClient: user?.userType === 'CLIENT',
    isFreelancer: user?.userType === 'FREELANCER',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



