import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import { 
  FaFileContract, 
  FaUser, 
  FaCalendarAlt, 
  FaDollarSign, 
  FaSpinner,
  FaSave,
  FaDownload,
  FaEdit,
  FaCheck,
  FaTimes
} from 'react-icons/fa';

const SmartContractGenerator = ({ onClose, jobId, clientId, freelancerId }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [contract, setContract] = useState({
    title: '',
    description: '',
    jobId: jobId || '',
    clientId: clientId || '',
    freelancerId: freelancerId || '',
    templateId: '',
    terms: {
      payment: '',
      timeline: '',
      deliverables: '',
      ip: '',
      termination: '',
      confidentiality: ''
    },
    expiresAt: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Mock templates for now - in real app, fetch from API
      setTemplates([
        {
          id: '1',
          name: 'Standard Freelance Contract',
          description: 'Basic freelance service agreement',
          category: 'General'
        },
        {
          id: '2',
          name: 'Web Development Contract',
          description: 'Contract for web development projects',
          category: 'Development'
        },
        {
          id: '3',
          name: 'Design Contract',
          description: 'Contract for design projects',
          category: 'Design'
        }
      ]);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setContract(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setContract(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleGenerateContract = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiService.generateSmartContract(contract);
      console.log('Contract generated:', response.data);
      // Handle success - maybe close modal or show success message
      if (onClose) onClose();
    } catch (error) {
      console.error('Error generating contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const contractTemplates = {
    '1': {
      content: `
# FREELANCE SERVICE AGREEMENT

**Project Title:** {{title}}
**Client:** {{clientName}}
**Freelancer:** {{freelancerName}}
**Date:** {{date}}

## 1. SCOPE OF WORK
{{description}}

## 2. PAYMENT TERMS
{{payment}}

## 3. TIMELINE
{{timeline}}

## 4. DELIVERABLES
{{deliverables}}

## 5. INTELLECTUAL PROPERTY
{{ip}}

## 6. TERMINATION
{{termination}}

## 7. CONFIDENTIALITY
{{confidentiality}}

## 8. GOVERNING LAW
This agreement shall be governed by the laws of the jurisdiction where the Freelancer resides.

**Client Signature:** _________________ Date: _________

**Freelancer Signature:** _________________ Date: _________
      `,
      variables: {
        title: contract.title,
        clientName: 'Client Name',
        freelancerName: 'Freelancer Name',
        date: new Date().toLocaleDateString(),
        description: contract.description,
        payment: contract.terms.payment,
        timeline: contract.terms.timeline,
        deliverables: contract.terms.deliverables,
        ip: contract.terms.ip,
        termination: contract.terms.termination,
        confidentiality: contract.terms.confidentiality
      }
    }
  };

  const previewContract = () => {
    if (!contract.templateId) return '';
    
    const template = contractTemplates[contract.templateId];
    if (!template) return '';

    let content = template.content;
    Object.keys(template.variables).forEach(key => {
      const value = template.variables[key] || '';
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return content;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaFileContract className="mr-3 text-blue-600" />
              Generate Smart Contract
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleGenerateContract} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Title
                </label>
                <input
                  type="text"
                  value={contract.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Web Development Agreement"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={contract.templateId}
                  onChange={(e) => handleInputChange('templateId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                value={contract.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe the project scope and requirements..."
                required
              />
            </div>

            {/* Contract Terms */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Contract Terms</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <textarea
                    value={contract.terms.payment}
                    onChange={(e) => handleInputChange('terms.payment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="e.g., 50% upfront, 50% on completion"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeline
                  </label>
                  <textarea
                    value={contract.terms.timeline}
                    onChange={(e) => handleInputChange('terms.timeline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="e.g., 4 weeks from start date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deliverables
                  </label>
                  <textarea
                    value={contract.terms.deliverables}
                    onChange={(e) => handleInputChange('terms.deliverables', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="e.g., Responsive website, source code, documentation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intellectual Property
                  </label>
                  <textarea
                    value={contract.terms.ip}
                    onChange={(e) => handleInputChange('terms.ip', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="e.g., Client owns all work product upon payment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Termination Clause
                  </label>
                  <textarea
                    value={contract.terms.termination}
                    onChange={(e) => handleInputChange('terms.termination', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="e.g., Either party may terminate with 7 days notice"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidentiality
                  </label>
                  <textarea
                    value={contract.terms.confidentiality}
                    onChange={(e) => handleInputChange('terms.confidentiality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="e.g., Both parties agree to maintain confidentiality"
                  />
                </div>
              </div>
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Expiration (Optional)
              </label>
              <input
                type="date"
                value={contract.expiresAt}
                onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Contract Preview */}
            {contract.templateId && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contract Preview</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {previewContract()}
                  </pre>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                <span>Generate Contract</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SmartContractGenerator;


