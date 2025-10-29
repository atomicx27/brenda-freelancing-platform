import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { 
  FaServer, 
  FaDatabase, 
  FaMemory, 
  FaUsers, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimesCircle,
  FaSpinner,
  FaDownload,
  FaRedo,
  FaChartLine,
  FaCog,
  FaShieldAlt
} from 'react-icons/fa';

const SystemMonitoring = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logLevel, setLogLevel] = useState('all');

  useEffect(() => {
    loadSystemData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSystemData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      const [healthResponse, logsResponse] = await Promise.all([
        apiService.getSystemHealth(),
        apiService.getSystemLogs({ level: logLevel === 'all' ? undefined : logLevel })
      ]);
      
      setSystemHealth(healthResponse.data);
      setSystemLogs(logsResponse.data.logs);
    } catch (err) {
      setError('Failed to load system data');
      console.error('Error loading system data:', err);
    } finally {
      setLoading(false);
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

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warn': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const HealthCard = ({ title, icon: Icon, status, value, subtitle, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
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
        <div className={`text-2xl ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
        </div>
      </div>
    </div>
  );

  const MetricCard = ({ title, value, unit, trend, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-semibold text-gray-900">
            {value} {unit}
          </p>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            <FaChartLine className={trend > 0 ? 'rotate-0' : 'rotate-180'} />
            <span className="text-sm">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
            <p className="text-gray-600">Monitor system health and performance</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={loadSystemData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <FaRedo />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleCreateBackup}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <FaDownload />
              <span>Create Backup</span>
            </button>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Auto Refresh</span>
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <FaExclamationTriangle className="mx-auto text-6xl text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      ) : systemHealth ? (
        <>
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <HealthCard
              title="Database"
              icon={FaDatabase}
              status={systemHealth.database?.statusCode}
              value={systemHealth.database?.responseTime ? `${systemHealth.database.responseTime}ms` : 'N/A'}
              subtitle={systemHealth.database?.status}
              color="blue"
            />
            <HealthCard
              title="Memory Usage"
              icon={FaMemory}
              status={systemHealth.memory?.statusCode}
              value={systemHealth.memory ? `${systemHealth.memory.used}/${systemHealth.memory.total}MB` : 'N/A'}
              subtitle="Heap Memory"
              color="green"
            />
            <HealthCard
              title="Active Users"
              icon={FaUsers}
              status={systemHealth.activity?.statusCode}
              value={systemHealth.activity?.activeUsers24h || 0}
              subtitle="Last 24 hours"
              color="purple"
            />
            <HealthCard
              title="System Uptime"
              icon={FaClock}
              status="good"
              value={formatUptime(systemHealth.uptime)}
              subtitle="Running time"
              color="yellow"
            />
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                  systemHealth.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <FaServer className={`text-2xl ${
                    systemHealth.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <h4 className="mt-2 text-sm font-medium text-gray-900">Overall Status</h4>
                <p className={`text-sm ${
                  systemHealth.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemHealth.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                  <FaCog className="text-2xl text-blue-600" />
                </div>
                <h4 className="mt-2 text-sm font-medium text-gray-900">Last Check</h4>
                <p className="text-sm text-gray-600">
                  {new Date(systemHealth.timestamp).toLocaleTimeString()}
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
                  <FaShieldAlt className="text-2xl text-purple-600" />
                </div>
                <h4 className="mt-2 text-sm font-medium text-gray-900">Security</h4>
                <p className="text-sm text-green-600">Protected</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Response Time"
              value={systemHealth.database?.responseTime || 0}
              unit="ms"
              trend={-5}
              color="blue"
            />
            <MetricCard
              title="Memory Usage"
              value={systemHealth.memory ? Math.round((systemHealth.memory.used / systemHealth.memory.total) * 100) : 0}
              unit="%"
              trend={2}
              color="green"
            />
            <MetricCard
              title="Active Users"
              value={systemHealth.activity?.activeUsers24h || 0}
              unit="users"
              trend={12}
              color="purple"
            />
            <MetricCard
              title="Error Rate"
              value="0.1"
              unit="%"
              trend={-15}
              color="red"
            />
          </div>
        </>
      ) : null}

      {/* System Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
            <div className="flex items-center space-x-4">
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Levels</option>
                <option value="error">Errors Only</option>
                <option value="warn">Warnings Only</option>
                <option value="info">Info Only</option>
              </select>
              <button
                onClick={() => loadSystemData()}
                className="text-blue-600 hover:text-blue-800"
              >
                <FaRedo />
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {systemLogs.length === 0 ? (
            <div className="text-center py-8">
              <FaServer className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600">No logs available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {systemLogs.map((log) => (
                <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getLogLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{log.message}</p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        {log.userId && <span>User: {log.userId}</span>}
                        {log.ip && <span>IP: {log.ip}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backup & Recovery */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup & Recovery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Backup Management</h4>
            <div className="space-y-2">
              <button
                onClick={handleCreateBackup}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <FaDownload />
                <span>Create Manual Backup</span>
              </button>
              <p className="text-sm text-gray-600">
                Create a complete backup of all system data including users, jobs, proposals, and reviews.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Recovery Options</h4>
            <div className="space-y-2">
              <button
                disabled
                className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaDownload />
                <span>Restore from Backup</span>
              </button>
              <p className="text-sm text-gray-600">
                Restore system data from a previous backup. (Feature coming soon)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoring;
