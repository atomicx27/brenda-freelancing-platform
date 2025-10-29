import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { FaFileContract, FaSave, FaArrowLeft } from 'react-icons/fa';

const SmartContractGenerator = () => {
  const navigate = useNavigate();
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                <input
                  type="text"
                  name="clientId"
                  value={form.clientId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Freelancer ID</label>
                <input
                  type="text"
                  name="freelancerId"
                  value={form.freelancerId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
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
