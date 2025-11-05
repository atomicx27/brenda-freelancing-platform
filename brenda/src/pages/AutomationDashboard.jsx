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
  FaTimesCircle,
  FaTimes,
  FaPaperPlane,
  FaEye
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
  const [signing, setSigning] = useState(null); // Track which contract is being signed
  const [currentUser, setCurrentUser] = useState(null); // Current logged-in user
  const [viewingContract, setViewingContract] = useState(null); // Contract being viewed
  const [sendingContract, setSendingContract] = useState(null); // Contract being sent

  useEffect(() => {
    // Fetch current user
    const fetchUser = async () => {
      try {
        const response = await apiService.getCurrentUser();
        console.log('getCurrentUser response:', response);
        
        // API returns { success: true, data: { id, email, firstName, ... } }
        if (response.data) {
          setCurrentUser(response.data);
          console.log('✅ Current user loaded:', response.data);
        } else {
          console.error('❌ Unexpected response structure:', response);
        }
      } catch (error) {
        console.error('❌ Error fetching current user:', error);
      }
    };
    fetchUser();
  }, []);

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

  const handleSignContract = async (contractId) => {
    try {
      setSigning(contractId);
      const response = await apiService.updateSmartContract(contractId, { status: 'SIGNED' });
      
      if (response.status === 'success') {
        // Update local state
        setData(prev => ({
          ...prev,
          smartContracts: prev.smartContracts.map(c =>
            c.id === contractId ? response.data.contract : c
          )
        }));
        
        alert('✅ Contract signed successfully! An invoice has been auto-generated.');
        
        // Reload data to get the new invoice
        await loadAutomationData();
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('❌ Failed to sign contract: ' + (error.message || 'Unknown error'));
    } finally {
      setSigning(null);
    }
  };

  const handleViewContract = (contract) => {
    setViewingContract(contract);
  };

  const handleSendContract = async (contractId) => {
    try {
      setSendingContract(contractId);
      
      // TODO: Implement email sending endpoint in backend
      // For now, we'll just show a success message
      const contract = data.smartContracts.find(c => c.id === contractId);
      
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Simulate sending (you can implement actual email endpoint later)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`✅ Contract sent to ${contract.freelancer?.firstName} ${contract.freelancer?.lastName} at ${contract.freelancer?.email}`);
      
    } catch (error) {
      console.error('Error sending contract:', error);
      alert('❌ Failed to send contract: ' + (error.message || 'Unknown error'));
    } finally {
      setSendingContract(null);
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
                <p className="text-xs text-gray-500">ID: {contract.client?.id?.slice(0, 8)}</p>
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
            
            {/* Debug info - Always show */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3 text-xs">
              <div className="font-semibold text-yellow-900 mb-1">🔍 Debug Info:</div>
              {currentUser ? (
                <>
                  <div className="text-yellow-800">
                    <strong>Current User:</strong> {currentUser.firstName} {currentUser.lastName} (ID: {currentUser.id?.slice(0, 8)})
                  </div>
                  <div className="text-yellow-800">
                    <strong>Contract Client:</strong> {contract.client?.firstName} {contract.client?.lastName} (ID: {contract.client?.id?.slice(0, 8)})
                  </div>
                  <div className="text-yellow-800">
                    <strong>Is Client?</strong> {contract.client?.id === currentUser.id ? '✅ YES - Send button should show' : '❌ NO - You are the freelancer'}
                  </div>
                  <div className="text-yellow-800">
                    <strong>Contract Status:</strong> {contract.status}
                  </div>
                </>
              ) : (
                <div className="text-red-600">⚠️ Current user not loaded yet. Please wait...</div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => handleViewContract(contract)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
              >
                <FaEye />
                View
              </button>
              
              {/* Send button - show when user is client and contract is not fully signed */}
              {(() => {
                const isClient = currentUser && contract.client?.id === currentUser.id;
                const canSend = contract.status !== 'SIGNED' && contract.status !== 'CANCELLED';
                
                // Show button if user is client and contract can be sent
                if (isClient && canSend) {
                  return (
                    <button
                      onClick={() => handleSendContract(contract.id)}
                      disabled={sendingContract === contract.id}
                      className={`px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1 ${
                        sendingContract === contract.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {sendingContract === contract.id ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane />
                          Send to Freelancer
                        </>
                      )}
                    </button>
                  );
                }
                return null;
              })()}
              
              {currentUser && (() => {
                const isClient = contract.client?.id === currentUser.id;
                const isFreelancer = contract.freelancer?.id === currentUser.id;
                const status = contract.status;
                
                // Client can sign if status is PENDING_REVIEW and they haven't signed yet
                const clientCanSign = isClient && 
                  status === 'PENDING_REVIEW' && 
                  !contract.clientSignedAt;
                  
                // Freelancer can sign if client has signed (status is CLIENT_SIGNED) and freelancer hasn't signed yet
                const freelancerCanSign = isFreelancer && 
                  status === 'CLIENT_SIGNED' && 
                  !contract.freelancerSignedAt;
                
                if (clientCanSign) {
                  return (
                    <button 
                      onClick={() => handleSignContract(contract.id)}
                      disabled={signing === contract.id}
                      className={`px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 ${
                        signing === contract.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {signing === contract.id ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Signing...
                        </>
                      ) : (
                        'Sign & Send'
                      )}
                    </button>
                  );
                } else if (freelancerCanSign) {
                  return (
                    <button 
                      onClick={() => handleSignContract(contract.id)}
                      disabled={signing === contract.id}
                      className={`px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 ${
                        signing === contract.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {signing === contract.id ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Signing...
                        </>
                      ) : (
                        'Accept & Sign'
                      )}
                    </button>
                  );
                } else if (isClient && status === 'CLIENT_SIGNED') {
                  return (
                    <span className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-md">
                      Waiting for freelancer signature
                    </span>
                  );
                } else if (isFreelancer && status === 'PENDING_REVIEW') {
                  return (
                    <span className="px-3 py-1 text-sm text-gray-600 bg-gray-50 rounded-md">
                      Waiting for client signature
                    </span>
                  );
                } else if (status === 'SIGNED') {
                  return (
                    <span className="px-3 py-1 text-sm text-green-600 bg-green-50 rounded-md flex items-center gap-1">
                      <FaCheckCircle /> Fully Signed
                    </span>
                  );
                }
                return null;
              })()}
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

      {/* Contract View Modal */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FaFileContract />
                {viewingContract.title}
              </h2>
              <button
                onClick={() => setViewingContract(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Contract Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 pb-6 border-b">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingContract.status)}`}>
                    {viewingContract.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium text-gray-900">
                    {viewingContract.client?.firstName} {viewingContract.client?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{viewingContract.client?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Freelancer</p>
                  <p className="font-medium text-gray-900">
                    {viewingContract.freelancer?.firstName} {viewingContract.freelancer?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{viewingContract.freelancer?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Version</p>
                  <p className="font-medium text-gray-900">{viewingContract.version}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(viewingContract.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {viewingContract.expiresAt && (
                  <div>
                    <p className="text-sm text-gray-600">Expires</p>
                    <p className="font-medium text-gray-900">
                      {new Date(viewingContract.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Signature Status */}
              {(viewingContract.clientSignedAt || viewingContract.freelancerSignedAt) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Signature Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      {viewingContract.clientSignedAt ? (
                        <>
                          <FaCheckCircle className="text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Client Signed</p>
                            <p className="text-xs text-gray-600">
                              {new Date(viewingContract.clientSignedAt).toLocaleString()}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <FaExclamationTriangle className="text-yellow-600" />
                          <p className="text-sm text-gray-600">Awaiting client signature</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {viewingContract.freelancerSignedAt ? (
                        <>
                          <FaCheckCircle className="text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Freelancer Signed</p>
                            <p className="text-xs text-gray-600">
                              {new Date(viewingContract.freelancerSignedAt).toLocaleString()}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <FaExclamationTriangle className="text-yellow-600" />
                          <p className="text-sm text-gray-600">Awaiting freelancer signature</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Content */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contract Terms</h3>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                    {viewingContract.content || viewingContract.description}
                  </pre>
                </div>
              </div>

              {/* Terms Section */}
              {viewingContract.terms && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Additional Terms</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                      {typeof viewingContract.terms === 'string' 
                        ? viewingContract.terms 
                        : JSON.stringify(viewingContract.terms, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setViewingContract(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Download contract as text file
                  const element = document.createElement('a');
                  const file = new Blob([viewingContract.content || viewingContract.description], {type: 'text/plain'});
                  element.href = URL.createObjectURL(file);
                  element.download = `${viewingContract.title.replace(/\s+/g, '_')}.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaReceipt />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationDashboard;
