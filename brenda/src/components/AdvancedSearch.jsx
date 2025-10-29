import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaMapMarkerAlt, 
  FaDollarSign, 
  FaClock, 
  FaUser, 
  FaStar,
  FaGlobe,
  FaLanguage,
  FaSpinner,
  FaSave,
  FaHistory
} from 'react-icons/fa';

const AdvancedSearch = ({ 
  type = 'jobs', // 'jobs' or 'freelancers'
  onSearchResults,
  onClose,
  showFilters = true 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    skills: [],
    budgetMin: '',
    budgetMax: '',
    budgetType: '',
    location: '',
    isRemote: false,
    experienceLevel: '',
    duration: '',
    availability: '',
    languages: [],
    hourlyRateMin: '',
    hourlyRateMax: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    loadSearchFilters();
    loadSavedSearches();
  }, []);

  const loadSearchFilters = async () => {
    try {
      const response = await apiService.getSearchFilters();
      setSearchFilters(response.data);
    } catch (error) {
      console.error('Error loading search filters:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const response = await apiService.getSearchPreferences();
      setSavedSearches(response.data.preferences?.savedSearches || []);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const handleSearch = async (customFilters = {}) => {
    setLoading(true);
    try {
      const searchParams = {
        query: searchQuery,
        ...filters,
        ...customFilters,
        sortBy,
        sortOrder,
        page: 1,
        limit: 20
      };

      // Remove empty values
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === '' || searchParams[key] === null || searchParams[key] === undefined) {
          delete searchParams[key];
        }
      });

      const response = type === 'jobs' 
        ? await apiService.advancedJobSearch(searchParams)
        : await apiService.advancedFreelancerSearch(searchParams);

      setSuggestions(response.data.suggestions || []);
      onSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSkillAdd = (skill) => {
    if (skill && !filters.skills.includes(skill)) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleLanguageAdd = (language) => {
    if (language && !filters.languages.includes(language)) {
      setFilters(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }));
    }
  };

  const handleLanguageRemove = (languageToRemove) => {
    setFilters(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== languageToRemove)
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      subcategory: '',
      skills: [],
      budgetMin: '',
      budgetMax: '',
      budgetType: '',
      location: '',
      isRemote: false,
      experienceLevel: '',
      duration: '',
      availability: '',
      languages: [],
      hourlyRateMin: '',
      hourlyRateMax: ''
    });
    setSearchQuery('');
  };

  const saveSearch = async () => {
    try {
      const searchData = {
        query: searchQuery,
        filters,
        sortBy,
        sortOrder,
        type,
        timestamp: new Date().toISOString()
      };

      const newSavedSearches = [...savedSearches, searchData];
      setSavedSearches(newSavedSearches);

      await apiService.saveSearchPreferences({
        savedSearches: newSavedSearches
      });
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const loadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setSortBy(savedSearch.sortBy);
    setSortOrder(savedSearch.sortOrder);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Advanced {type === 'jobs' ? 'Job' : 'Freelancer'} Search
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="text-xl" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Search ${type === 'jobs' ? 'jobs' : 'freelancers'}...`}
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => {
                  setSearchQuery(suggestion.title || suggestion.skill);
                  setShowSuggestions(false);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{suggestion.title || suggestion.skill}</div>
                {suggestion.category && (
                  <div className="text-sm text-gray-500">{suggestion.category}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {searchFilters?.categories?.slice(0, 8).map((category) => (
            <button
              key={category.category}
              onClick={() => handleFilterChange('category', category.category)}
              className={`px-3 py-1 rounded-full text-sm ${
                filters.category === category.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.category} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <FaFilter />
          <span>{showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters</span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {filters.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {skill}
                  <button
                    onClick={() => handleSkillRemove(skill)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleSkillAdd(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Add skill...</option>
              {searchFilters?.skills?.map((skill) => (
                <option key={skill.skill} value={skill.skill}>
                  {skill.skill} ({skill.count})
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter location"
              />
            </div>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={filters.isRemote}
                onChange={(e) => handleFilterChange('isRemote', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Remote work</span>
            </label>
          </div>

          {/* Budget */}
          {type === 'jobs' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.budgetMin}
                  onChange={(e) => handleFilterChange('budgetMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={filters.budgetMax}
                  onChange={(e) => handleFilterChange('budgetMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Max"
                />
              </div>
              <select
                value={filters.budgetType}
                onChange={(e) => handleFilterChange('budgetType', e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Budget Type</option>
                {searchFilters?.budgetTypes?.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hourly Rate (for freelancers) */}
          {type === 'freelancers' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={filters.hourlyRateMin}
                  onChange={(e) => handleFilterChange('hourlyRateMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Min $/hr"
                />
                <input
                  type="number"
                  value={filters.hourlyRateMax}
                  onChange={(e) => handleFilterChange('hourlyRateMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Max $/hr"
                />
              </div>
            </div>
          )}

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
            <select
              value={filters.experienceLevel}
              onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any Experience</option>
              {searchFilters?.experienceLevels?.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration (for jobs) */}
          {type === 'jobs' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Duration</option>
                {searchFilters?.durations?.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Availability (for freelancers) */}
          {type === 'freelancers' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Availability</option>
                {searchFilters?.availabilities?.map((availability) => (
                  <option key={availability} value={availability}>
                    {availability}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {filters.languages.map((language) => (
                <span
                  key={language}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                >
                  {language}
                  <button
                    onClick={() => handleLanguageRemove(language)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleLanguageAdd(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Add language...</option>
              {searchFilters?.languages?.map((lang) => (
                <option key={lang.language} value={lang.language}>
                  {lang.language} ({lang.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt">Date Posted</option>
            <option value="budget">Budget</option>
            <option value="title">Title</option>
            {type === 'freelancers' && (
              <>
                <option value="hourlyRate">Hourly Rate</option>
                <option value="experience">Experience</option>
              </>
            )}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <button
            onClick={saveSearch}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <FaSave />
            <span>Save Search</span>
          </button>
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
          <span>Search</span>
        </button>
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <FaHistory className="mr-2" />
            Saved Searches
          </h3>
          <div className="space-y-2">
            {savedSearches.slice(0, 5).map((search, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <div className="font-medium">{search.query || 'No query'}</div>
                  <div className="text-sm text-gray-500">
                    {search.filters.category && `Category: ${search.filters.category}`}
                    {search.filters.skills.length > 0 && ` • Skills: ${search.filters.skills.join(', ')}`}
                  </div>
                </div>
                <button
                  onClick={() => loadSavedSearch(search)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;


