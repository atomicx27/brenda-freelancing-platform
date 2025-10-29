import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import { 
  FaRobot, 
  FaFileContract, 
  FaReceipt, 
  FaEnvelope, 
  FaBullseye, 
  FaClock, 
  FaBell, 
  FaCog,
  FaSpinner,
  FaPlus,
  FaPlay,
  FaPause,
  FaEdit,
  FaTrash,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle
} from 'react-icons/fa';

const AutomationDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    automationRules: [],
    smartContracts: [],
    invoices: [],
    emailCampaigns: [],
    leadScores: [],
    followUpRules: [],
    reminders: [],
    statusUpdateRules: []
  });

  const [testEmail, setTestEmail] = useState({
    to: '',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
  });
  const [emailResult, setEmailResult] = useState({ ok: null, message: '' });

  useEffect(() => {
    loadAutomationData();
  }, [activeTab]);

  const loadAutomationData = async () => {
    setLoading(true);
    try {
      const tasks = [];
      const map = [];

      if (activeTab === 'overview' || activeTab === 'rules') {
        tasks.push(apiService.getAutomationRules());
        map.push('rules');
      }
      if (activeTab === 'overview' || activeTab === 'contracts') {
        tasks.push(apiService.getSmartContracts());
        map.push('contracts');
      }
      if (activeTab === 'overview' || activeTab === 'invoicing') {
        tasks.push(apiService.getInvoices());
        map.push('invoices');
      }
      if (activeTab === 'overview' || activeTab === 'email') {
        tasks.push(apiService.getEmailCampaigns());
        map.push('email');
      }
      if (activeTab === 'overview' || activeTab === 'leads') {
        tasks.push(apiService.getLeadScores());
        map.push('leads');
      }
      if (activeTab === 'overview' || activeTab === 'followup') {
        tasks.push(apiService.getFollowUpRules());
        map.push('followup');
      }
      if (activeTab === 'overview' || activeTab === 'reminders') {
        tasks.push(apiService.getReminders());
        map.push('reminders');
      }
      if (activeTab === 'overview' || activeTab === 'status') {
        tasks.push(apiService.getStatusUpdateRules());
        map.push('status');
      }

      const results = await Promise.allSettled(tasks);

      let nextState = { ...data };
      results.forEach((res, idx) => {
        const key = map[idx];
        if (res.status === 'fulfilled') {
          const payload = res.value?.data || {};
          if (key === 'rules') nextState.automationRules = payload.rules || [];
          if (key === 'contracts') nextState.smartContracts = payload.contracts || [];
          if (key === 'invoices') nextState.invoices = payload.invoices || [];
          if (key === 'email') nextState.emailCampaigns = payload.campaigns || [];
          if (key === 'leads') nextState.leadScores = payload.leadScores || [];
          if (key === 'followup') nextState.followUpRules = payload.rules || [];
          if (key === 'reminders') nextState.reminders = payload.reminders || [];
          if (key === 'status') nextState.statusUpdateRules = payload.rules || [];
        } else {
          // Log but don't blow up the whole overview
          console.warn(`Failed to load ${key}:`, res.reason?.message || res.reason);
          if (key === 'rules') nextState.automationRules = [];
          if (key === 'contracts') nextState.smartContracts = [];
          if (key === 'invoices') nextState.invoices = [];
          if (key === 'email') nextState.emailCampaigns = [];
          if (key === 'leads') nextState.leadScores = [];
          if (key === 'followup') nextState.followUpRules = [];
          if (key === 'reminders') nextState.reminders = [];
          if (key === 'status') nextState.statusUpdateRules = [];
        }
      });

      setData(nextState);
    } catch (error) {
      console.error('Error loading automation data (unexpected):', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaChartLine, color: 'blue' },
    { id: 'rules', label: 'Automation Rules', icon: FaRobot, color: 'purple' },
    { id: 'contracts', label: 'Smart Contracts', icon: FaFileContract, color: 'green' },
    { id: 'invoicing', label: 'Automated Invoicing', icon: FaReceipt, color: 'orange' },
    { id: 'email', label: 'Email Marketing', icon: FaEnvelope, color: 'red' },
    { id: 'leads', label: 'Lead Scoring', icon: FaBullseye, color: 'indigo' },
    { id: 'followup', label: 'Follow-up Automation', icon: FaClock, color: 'yellow' },
    { id: 'reminders', label: 'Deadline Reminders', icon: FaBell, color: 'pink' },
    { id: 'status', label: 'Status Updates', icon: FaCog, color: 'gray' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'SUCCESS':
      case 'PAID':
      case 'SIGNED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
      case 'DRAFT':
      case 'SCHEDULED':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
      case 'CANCELLED':
      case 'OVERDUE':
        return 'text-red-600 bg-red-100';
      case 'RUNNING':
      case 'SENT':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'SUCCESS':
      case 'PAID':
      case 'SIGNED':
        return <FaCheckCircle className="text-green-500" />;
      case 'PENDING':
      case 'DRAFT':
      case 'SCHEDULED':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'FAILED':
      case 'CANCELLED':
      case 'OVERDUE':
        return <FaTimesCircle className="text-red-500" />;
      case 'RUNNING':
      case 'SENT':
        return <FaSpinner className="animate-spin text-blue-500" />;
      default:
        return <FaCog className="text-gray-500" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Rules</p>
              <p className="text-2xl font-bold text-gray-900">{data.automationRules.filter(r => r.isActive).length}</p>
            </div>
            <FaRobot className="text-3xl text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Smart Contracts</p>
              <p className="text-2xl font-bold text-gray-900">{data.smartContracts.length}</p>
            </div>
            <FaFileContract className="text-3xl text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{data.invoices.filter(i => i.status === 'SENT').length}</p>
            </div>
            <FaReceipt className="text-3xl text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Email Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{data.emailCampaigns.length}</p>
            </div>
            <FaEnvelope className="text-3xl text-red-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Automation Activity</h3>
        <div className="space-y-3">
          {data.automationRules.slice(0, 5).map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(rule.isActive ? 'ACTIVE' : 'INACTIVE')}
                <div>
                  <p className="font-medium text-gray-800">{rule.name}</p>
                  <p className="text-sm text-gray-600">{rule.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Runs: {rule.runCount}</p>
                <p className="text-sm text-gray-600">Success: {rule.successCount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send Test Email via Resend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Test Email (Resend)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="email"
            placeholder="Recipient email"
            className="border rounded px-3 py-2"
            value={testEmail.to}
            onChange={(e) => setTestEmail(prev => ({ ...prev, to: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Subject"
            className="border rounded px-3 py-2"
            value={testEmail.subject}
            onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={async () => {
              if (!testEmail.to) {
                setEmailResult({ ok: false, message: 'Please enter recipient email' });
                return;
              }
              try {
                setLoading(true);
                setEmailResult({ ok: null, message: '' });
                await apiService.sendTestEmail({
                  to: testEmail.to,
                  subject: testEmail.subject,
                  html: testEmail.html
                });
                setEmailResult({ ok: true, message: 'Email sent successfully' });
              } catch (e) {
                setEmailResult({ ok: false, message: e.message || 'Failed to send email' });
              } finally {
                setLoading(false);
              }
            }}
          >
            Send Test Email
          </button>
        </div>
        <div className="mt-3">
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={4}
            value={testEmail.html}
            onChange={(e) => setTestEmail(prev => ({ ...prev, html: e.target.value }))}
          />
        </div>
        {emailResult.ok !== null && (
          <div className={`mt-3 text-sm ${emailResult.ok ? 'text-green-600' : 'text-red-600'}`}>
            {emailResult.message}
          </div>
        )}
      </div>
    </div>
  );

  const renderAutomationRules = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Automation Rules</h2>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          onClick={() => navigate('/automation')}
        >
          <FaPlus />
          <span>Create Rule</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {data.automationRules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{rule.name}</h3>
                <p className="text-gray-600">{rule.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rule.isActive ? 'ACTIVE' : 'INACTIVE')}`}>
                  {rule.isActive ? 'Active' : 'Inactive'}
                </span>
                <button className="text-gray-500 hover:text-gray-700">
                  <FaEdit />
                </button>
                <button className="text-gray-500 hover:text-red-500">
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Type</p>
                <p className="font-medium">{rule.type}</p>
              </div>
              <div>
                <p className="text-gray-600">Trigger</p>
                <p className="font-medium">{rule.trigger}</p>
              </div>
              <div>
                <p className="text-gray-600">Runs</p>
                <p className="font-medium">{rule.runCount}</p>
              </div>
              <div>
                <p className="text-gray-600">Success Rate</p>
                <p className="font-medium">{rule.runCount > 0 ? Math.round((rule.successCount / rule.runCount) * 100) : 0}%</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
                onClick={async () => {
                  try {
                    setLoading(true);
                    await apiService.executeAutomationRule(rule.id);
                    await loadAutomationData();
                  } catch (e) {
                    console.error('Failed to execute rule', e);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <FaPlay />
                <span>Execute</span>
              </button>
              <button className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-1">
                <FaPause />
                <span>Pause</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSmartContracts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Smart Contracts</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          onClick={() => navigate('/automation/contracts/new')}
        >
          <FaPlus />
          <span>Generate Contract</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {data.smartContracts.map((contract) => (
          <div key={contract.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{contract.title}</h3>
                <p className="text-gray-600">{contract.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                {contract.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-600">Client</p>
                <p className="font-medium">{contract.client?.firstName} {contract.client?.lastName}</p>
              </div>
              <div>
                <p className="text-gray-600">Freelancer</p>
                <p className="font-medium">{contract.freelancer?.firstName} {contract.freelancer?.lastName}</p>
              </div>
              <div>
                <p className="text-gray-600">Version</p>
                <p className="font-medium">{contract.version}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                View
              </button>
              <button className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">
                Sign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Automated Invoices</h2>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
          <FaPlus />
          <span>Generate Invoice</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {data.invoices.map((invoice) => (
          <div key={invoice.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{invoice.title}</h3>
                <p className="text-gray-600">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${invoice.total}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-600">Client</p>
                <p className="font-medium">{invoice.client?.firstName} {invoice.client?.lastName}</p>
              </div>
              <div>
                <p className="text-gray-600">Due Date</p>
                <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Currency</p>
                <p className="font-medium">{invoice.currency}</p>
              </div>
              <div>
                <p className="text-gray-600">Recurring</p>
                <p className="font-medium">{invoice.isRecurring ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                View
              </button>
              <button className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">
                Send
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'rules':
        return renderAutomationRules();
      case 'contracts':
        return renderSmartContracts();
      case 'invoicing':
        return renderInvoices();
      default:
        return (
          <div className="text-center py-12">
            <FaRobot className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Coming Soon</h3>
            <p className="text-gray-500">This automation feature is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Workflow Automation
          </h1>
          <p className="text-lg text-gray-600">
            Automate your business processes and workflows
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="flex flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? `bg-${tab.color}-600 text-white`
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AutomationDashboard;
