import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!isAuthenticated) {
      navigate('/account-security/login');
      return;
    }

    // Route to appropriate dashboard based on user type
    switch (user?.userType) {
      case 'FREELANCER':
        navigate('/dashboard/freelancer');
        break;
      case 'CLIENT':
        navigate('/dashboard/client');
        break;
      case 'ADMIN':
        navigate('/dashboard/admin');
        break;
      default:
        // If user type is not set, redirect to profile to complete setup
        navigate('/profile');
        break;
    }
  }, [isAuthenticated, user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  // This component will redirect, so we don't need to render anything
  return null;
};

export default Dashboard;



