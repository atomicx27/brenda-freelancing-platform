import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import UserManagement from '../components/UserManagement';
import ContentModeration from '../components/ContentModeration';
import SystemMonitoring from '../components/SystemMonitoring';
import MentorApplicationManagement from '../components/MentorApplicationManagement';
import { 
  FaUsers, 
  FaBriefcase, 
  FaFileAlt, 
  FaStar, 
  FaComments, 
  FaChartLine,
  FaShieldAlt,
  FaCog,
  FaDatabase,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaEye,
  FaEdit,
  FaBan,
  FaCheck,
  FaDownload,
  FaServer,
  FaClock,
  FaGraduationCap
} from 'react-icons/fa';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    if (user?.userType === 'ADMIN') {
      loadDashboardData();
      loadSystemHealth();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminDashboard();
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await apiService.getSystemHealth();
      setSystemHealth(response.data);
    } catch (err) {
      console.error('Error loading system health:', err);
    }
  };


  const handleCreateBackup = async () => {
    try {
      const response = await apiService.createBackup();
      alert('Backup created successfully!');
    } catch (err) {
      console.error('Error creating backup:', err);
      alert('Failed to create backup');
    }
  };

  if (user?.userType !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaShieldAlt className="mx-auto text-6xl text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/admin/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto text-6xl text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`text-2xl text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const HealthIndicator = ({ status, label }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'good': return 'text-green-500';
        case 'warning': return 'text-yellow-500';
        case 'critical': return 'text-red-500';
        default: return 'text-gray-500';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'good': return <FaCheckCircle />;
        case 'warning': return <FaExclamationTriangle />;
        case 'critical': return <FaTimesCircle />;
        default: return <FaClock />;
      }
    };

    return (
      <div className="flex items-center space-x-2">
        <span className={getStatusColor(status)}>{getStatusIcon(status)}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your platform</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleCreateBackup}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <FaDownload />
                <span>Create Backup</span>
              </button>
              <button
                onClick={loadSystemHealth}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <FaServer />
                <span>Refresh Health</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: FaChartLine },
              { id: 'users', label: 'User Management', icon: FaUsers },
              { id: 'mentors', label: 'Mentor Applications', icon: FaGraduationCap },
              { id: 'moderation', label: 'Content Moderation', icon: FaShieldAlt },
              { id: 'system', label: 'System Monitoring', icon: FaCog }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={dashboardData.overview.users.total}
                icon={FaUsers}
                color="blue"
                subtitle={`${dashboardData.overview.users.freelancers} freelancers, ${dashboardData.overview.users.clients} clients`}
              />
              <StatCard
                title="Total Jobs"
                value={dashboardData.overview.jobs.total}
                icon={FaBriefcase}
                color="green"
                subtitle={`${dashboardData.overview.jobs.open} open, ${dashboardData.overview.jobs.closed} closed`}
              />
              <StatCard
                title="Total Proposals"
                value={dashboardData.overview.proposals.total}
                icon={FaFileAlt}
                color="yellow"
                subtitle={`${dashboardData.overview.proposals.pending} pending, ${dashboardData.overview.proposals.accepted} accepted`}
              />
              <StatCard
                title="Total Reviews"
                value={dashboardData.overview.reviews.total}
                icon={FaStar}
                color="purple"
              />
            </div>

            {/* System Health */}
            {systemHealth && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <HealthIndicator
                    status={systemHealth.database?.statusCode}
                    label={`Database (${systemHealth.database?.responseTime}ms)`}
                  />
                  <HealthIndicator
                    status={systemHealth.memory?.statusCode}
                    label={`Memory (${systemHealth.memory?.used}MB/${systemHealth.memory?.total}MB)`}
                  />
                  <HealthIndicator
                    status={systemHealth.activity?.statusCode}
                    label={`Activity (${systemHealth.activity?.activeUsers24h} users)`}
                  />
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {dashboardData.recentActivity.users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.userType === 'FREELANCER' ? 'bg-blue-100 text-blue-800' :
                        user.userType === 'CLIENT' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {user.userType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Jobs</h3>
                <div className="space-y-3">
                  {dashboardData.recentActivity.jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">
                          by {job.owner.firstName} {job.owner.lastName}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'mentors' && <MentorApplicationManagement />}

        {activeTab === 'moderation' && <ContentModeration />}

        {activeTab === 'system' && <SystemMonitoring />}
      </div>
    </div>
  );
};

export default AdminDashboard;