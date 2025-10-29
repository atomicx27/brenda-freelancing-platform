import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaLock, FaUser, FaCog, FaChartLine } from 'react-icons/fa';

const AdminAccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="mx-auto h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
            <FaShieldAlt className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Admin Portal Access
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Secure administrative access to the Brenda platform management system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Admin Login Card */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-6">
              <FaLock className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
              <p className="text-gray-600 mt-2">
                Access the administrative dashboard with your admin credentials
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Admin Features</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• User management and moderation</li>
                  <li>• Content approval and review</li>
                  <li>• System health monitoring</li>
                  <li>• Platform analytics and reports</li>
                  <li>• Data backup and recovery</li>
                </ul>
              </div>
              
              <Link
                to="/admin/login"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-semibold"
              >
                <FaUser />
                <span>Login to Admin Portal</span>
              </Link>
            </div>
          </div>

          {/* System Information Card */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-6">
              <FaCog className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">System Status</h2>
              <p className="text-gray-600 mt-2">
                Current platform status and health information
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium">Platform Status</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    Online
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">Database</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    Connected
                  </span>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-purple-800 font-medium">API Services</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    Active
                  </span>
                </div>
              </div>
              
              <Link
                to="/dashboard"
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-semibold"
              >
                <FaChartLine />
                <span>View Public Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">
                Security Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This admin portal is restricted to authorized personnel only. All access attempts are logged and monitored. 
                  Unauthorized access is strictly prohibited and may result in legal action.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-blue-200 hover:text-white transition-colors"
          >
            ← Back to Main Site
          </Link>
          <p className="text-xs text-blue-300 mt-4">
            Brenda Admin Portal v1.0 - Secure Access Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;


