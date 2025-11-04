import React, { useState } from 'react';
import { FaTimes, FaGraduationCap, FaPlus, FaMinus } from 'react-icons/fa';
import PropTypes from 'prop-types';

const BecomeMentorModal = ({ isOpen, onClose, onSubmit, existingApplication }) => {
  const [formData, setFormData] = useState({
    expertise: existingApplication?.expertise || [''],
    experience: existingApplication?.experience || '',
    motivation: existingApplication?.motivation || '',
    availability: existingApplication?.availability || '',
    linkedinUrl: existingApplication?.linkedinUrl || '',
    portfolioUrl: existingApplication?.portfolioUrl || '',
    achievements: existingApplication?.achievements || ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleExpertiseChange = (index, value) => {
    const newExpertise = [...formData.expertise];
    newExpertise[index] = value;
    setFormData(prev => ({ ...prev, expertise: newExpertise }));
  };

  const addExpertiseField = () => {
    setFormData(prev => ({
      ...prev,
      expertise: [...prev.expertise, '']
    }));
  };

  const removeExpertiseField = (index) => {
    if (formData.expertise.length > 1) {
      const newExpertise = formData.expertise.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, expertise: newExpertise }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Validate expertise
    const validExpertise = formData.expertise.filter(e => e.trim() !== '');
    if (validExpertise.length === 0) {
      newErrors.expertise = 'Please provide at least one area of expertise';
    }

    // Validate experience
    if (!formData.experience || Number(formData.experience) < 0) {
      newErrors.experience = 'Please provide valid years of experience';
    }

    // Validate motivation
    if (!formData.motivation || formData.motivation.trim().length < 50) {
      newErrors.motivation = 'Please provide a detailed motivation (minimum 50 characters)';
    }

    // Validate availability
    if (!formData.availability) {
      newErrors.availability = 'Please specify your availability';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Filter out empty expertise fields
    const cleanedData = {
      ...formData,
      expertise: formData.expertise.filter(e => e.trim() !== ''),
      experience: Number(formData.experience)
    };

    await onSubmit(cleanedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8 shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FaGraduationCap className="text-3xl" />
            <h2 className="text-2xl font-bold">
              {existingApplication ? 'Update' : 'Become a'} Mentor Application
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            type="button"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
            {/* Introduction */}
            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
              <p className="text-gray-700">
                Share your expertise and help others grow! Fill out this application to become a mentor on our platform.
              </p>
            </div>

            {/* Areas of Expertise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Expertise <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-3">
                What topics can you mentor others in?
              </p>
              {formData.expertise.map((exp, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={exp}
                    onChange={(e) => handleExpertiseChange(index, e.target.value)}
                    placeholder="e.g., React Development, UI/UX Design, DevOps..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {formData.expertise.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExpertiseField(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <FaMinus />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addExpertiseField}
                className="mt-2 flex items-center space-x-2 text-purple-600 hover:text-purple-700"
              >
                <FaPlus />
                <span className="text-sm font-medium">Add Another Area</span>
              </button>
              {errors.expertise && (
                <p className="mt-1 text-sm text-red-600">{errors.expertise}</p>
              )}
            </div>

            {/* Years of Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Professional Experience <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
                placeholder="e.g., 5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-600">{errors.experience}</p>
              )}
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want to become a mentor? <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Share your passion for mentoring and what drives you to help others (minimum 50 characters)
              </p>
              <textarea
                value={formData.motivation}
                onChange={(e) => handleChange('motivation', e.target.value)}
                placeholder="I want to mentor because..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.motivation && (
                  <p className="text-sm text-red-600">{errors.motivation}</p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.motivation.length} / 50 characters
                </p>
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">
                How many hours per week can you dedicate to mentoring?
              </p>
              <select
                value={formData.availability}
                onChange={(e) => handleChange('availability', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select availability</option>
                <option value="1-2 hours/week">1-2 hours per week</option>
                <option value="3-5 hours/week">3-5 hours per week</option>
                <option value="6-10 hours/week">6-10 hours per week</option>
                <option value="10+ hours/week">10+ hours per week</option>
              </select>
              {errors.availability && (
                <p className="mt-1 text-sm text-red-600">{errors.availability}</p>
              )}
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Portfolio URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio/Website URL
              </label>
              <input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Achievements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notable Achievements (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Share any certifications, awards, or notable projects
              </p>
              <textarea
                value={formData.achievements}
                onChange={(e) => handleChange('achievements', e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect, Published 50+ articles on Medium..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            </div>
          </div>

          {/* Submit Buttons - Always Visible */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex-shrink-0">
            <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              {existingApplication ? 'Update Application' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

BecomeMentorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  existingApplication: PropTypes.object
};

export default BecomeMentorModal;
