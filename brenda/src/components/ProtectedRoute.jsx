import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true, allowedUserTypes = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not logged in
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/account-security/login" state={{ from: location }} replace />;
  }

  // Redirect to home if user is logged in but trying to access auth pages
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check user type permissions
  if (allowedUserTypes.length > 0 && user && !allowedUserTypes.includes(user.userType)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;



