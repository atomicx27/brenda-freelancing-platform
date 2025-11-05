import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { FaFileContract, FaSave, FaArrowLeft, FaSearch, FaTimes } from 'react-icons/fa';

const SmartContractGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    jobId: '',
    clientId: '',
    freelancerId: '',
    templateId: '',
    terms: {
      description: '',
      payment: '',
      timeline: '',
      ip: ''
    },
    expiresAt: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // User search states
  const [clientSearch, setClientSearch] = useState('');
  const [freelancerSearch, setFreelancerSearch] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showFreelancerDropdown, setShowFreelancerDropdown] = useState(false);

  // Load users on mount
  useEffect(() => {
    loadUsers();
    // Auto-fill freelancer if current user is a freelancer
    if (user?.userType === 'FREELANCER') {
      setSelectedFreelancer(user);
      setForm(prev => ({ ...prev, freelancerId: user.id }));
      setFreelancerSearch(`${user.firstName} ${user.lastName} (${user.email})`);
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      // Get all users using the existing getAllUsers method
      const response = await apiService.getAllUsers();
      setAllUsers(response.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      // Fallback: use empty array, user can still enter ID manually
      setAllUsers([]);
    }
  };

  // Filter clients when search changes
  useEffect(() => {
    if (clientSearch.length > 0) {
      const filtered = allUsers.filter(u => 
        u.userType === 'CLIENT' &&
        (u.firstName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
         u.lastName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
         u.email?.toLowerCase().includes(clientSearch.toLowerCase()))
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients([]);
    }
  }, [clientSearch, allUsers]);

  // Filter freelancers when search changes
  useEffect(() => {
    if (freelancerSearch.length > 0 && user?.userType !== 'FREELANCER') {
      const filtered = allUsers.filter(u => 
        u.userType === 'FREELANCER' &&
        (u.firstName?.toLowerCase().includes(freelancerSearch.toLowerCase()) ||
         u.lastName?.toLowerCase().includes(freelancerSearch.toLowerCase()) ||
         u.email?.toLowerCase().includes(freelancerSearch.toLowerCase()))
      );
      setFilteredFreelancers(filtered);
    } else {
      setFilteredFreelancers([]);
    }
  }, [freelancerSearch, allUsers, user]);

  const selectClient = (client) => {
    setSelectedClient(client);
    setForm(prev => ({ ...prev, clientId: client.id }));
    setClientSearch(`${client.firstName} ${client.lastName} (${client.email})`);
    setShowClientDropdown(false);
  };

  const selectFreelancer = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setForm(prev => ({ ...prev, freelancerId: freelancer.id }));
    setFreelancerSearch(`${freelancer.firstName} ${freelancer.lastName} (${freelancer.email})`);
    setShowFreelancerDropdown(false);
  };

  const clearClient = () => {
    setSelectedClient(null);
    setClientSearch('');
    setForm(prev => ({ ...prev, clientId: '' }));
  };

  const clearFreelancer = () => {
    if (user?.userType !== 'FREELANCER') {
      setSelectedFreelancer(null);
      setFreelancerSearch('');
      setForm(prev => ({ ...prev, freelancerId: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTermsChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, terms: { ...prev.terms, [name]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: form.title,
        description: form.description,
        jobId: form.jobId || null,
        clientId: form.clientId,
        freelancerId: form.freelancerId,
        templateId: form.templateId || null,
        terms: form.terms,
        expiresAt: form.expiresAt || null
      };

      const res = await apiService.generateSmartContract(payload);
      setSuccess('Contract generated successfully');

      // Navigate back to dashboard contracts tab after a short delay
      setTimeout(() => navigate('/automation'), 800);
    } catch (err) {
      setError(err.message || 'Failed to generate contract');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaFileContract className="text-green-600" />
            Generate Smart Contract
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded bg-green-100 text-green-700 text-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related Job ID (optional)</label>
                <input
                  type="text"
                  name="jobId"
                  value={form.jobId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="job_..."
                />
              </div>
              
              {/* Client Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client {selectedClient && <span className="text-green-600">✓</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Search client by name or email..."
                    className="w-full border rounded px-3 py-2 pr-10"
                    required={!selectedClient}
                  />
                  {selectedClient ? (
                    <button
                      type="button"
                      onClick={clearClient}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
                    >
                      <FaTimes />
                    </button>
                  ) : (
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                </div>
                
                {/* Client Dropdown */}
                {showClientDropdown && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                        <div className="text-xs text-blue-600 mt-1">CLIENT</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {showClientDropdown && clientSearch && filteredClients.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-gray-500 text-sm">
                    No clients found. Try a different search term.
                  </div>
                )}
              </div>
              
              {/* Freelancer Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Freelancer {selectedFreelancer && <span className="text-green-600">✓</span>}
                  {user?.userType === 'FREELANCER' && <span className="text-gray-500 text-xs ml-2">(You)</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={freelancerSearch}
                    onChange={(e) => {
                      setFreelancerSearch(e.target.value);
                      setShowFreelancerDropdown(true);
                    }}
                    onFocus={() => setShowFreelancerDropdown(true)}
                    placeholder="Search freelancer by name or email..."
                    className="w-full border rounded px-3 py-2 pr-10"
                    required={!selectedFreelancer}
                    disabled={user?.userType === 'FREELANCER'}
                  />
                  {selectedFreelancer && user?.userType !== 'FREELANCER' ? (
                    <button
                      type="button"
                      onClick={clearFreelancer}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
                    >
                      <FaTimes />
                    </button>
                  ) : (
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                </div>
                
                {/* Freelancer Dropdown */}
                {showFreelancerDropdown && filteredFreelancers.length > 0 && user?.userType !== 'FREELANCER' && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredFreelancers.map((freelancer) => (
                      <button
                        key={freelancer.id}
                        type="button"
                        onClick={() => selectFreelancer(freelancer)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {freelancer.firstName} {freelancer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{freelancer.email}</div>
                        <div className="text-xs text-green-600 mt-1">FREELANCER</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {showFreelancerDropdown && freelancerSearch && filteredFreelancers.length === 0 && user?.userType !== 'FREELANCER' && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-gray-500 text-sm">
                    No freelancers found. Try a different search term.
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template ID (optional)</label>
                <input
                  type="text"
                  name="templateId"
                  value={form.templateId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="tmpl_..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
                <input
                  type="date"
                  name="expiresAt"
                  value={form.expiresAt}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full border rounded px-3 py-2"
                placeholder="Contract description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms - Description</label>
                <textarea
                  name="description"
                  value={form.terms.description}
                  onChange={handleTermsChange}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                  placeholder="High-level terms description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms - Payment</label>
                <textarea
                  name="payment"
                  value={form.terms.payment}
                  onChange={handleTermsChange}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Payment terms..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms - Timeline</label>
                <textarea
                  name="timeline"
                  value={form.terms.timeline}
                  onChange={handleTermsChange}
                  rows={2}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Timeline terms..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms - Intellectual Property</label>
                <textarea
                  name="ip"
                  value={form.terms.ip}
                  onChange={handleTermsChange}
                  rows={2}
                  className="w-full border rounded px-3 py-2"
                  placeholder="IP terms..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/automation')}
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FaSave />
                {submitting ? 'Generating...' : 'Generate Contract'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SmartContractGenerator;
