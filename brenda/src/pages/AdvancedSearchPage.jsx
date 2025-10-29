import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import AdvancedSearch from '../components/AdvancedSearch';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const AdvancedSearchPage = () => {
  const { t } = useLanguage();
  const [searchType, setSearchType] = useState('jobs');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(true);

  const handleSearchResults = (results) => {
    setSearchResults(results);
    setShowSearch(false);
  };

  const handleBackToSearch = () => {
    setShowSearch(true);
    setSearchResults(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('search.advancedSearch')}
          </h1>
          <p className="text-lg text-gray-600">
            Find the perfect {searchType === 'jobs' ? 'jobs' : 'freelancers'} with our advanced search and filtering system
          </p>
        </div>

        {/* Search Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setSearchType('jobs')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                searchType === 'jobs'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaSearch className="inline-block mr-2" />
              Search Jobs
            </button>
            <button
              onClick={() => setSearchType('freelancers')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                searchType === 'freelancers'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaFilter className="inline-block mr-2" />
              Search Freelancers
            </button>
          </div>
        </div>

        {/* Search Component */}
        {showSearch && (
          <div className="max-w-4xl mx-auto">
            <AdvancedSearch
              type={searchType}
              onSearchResults={handleSearchResults}
              showFilters={true}
            />
          </div>
        )}

        {/* Search Results */}
        {searchResults && !showSearch && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Results Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {t('search.results')}
                  </h2>
                  <p className="text-gray-600">
                    Found {searchResults.pagination?.total || 0} {searchType}
                  </p>
                </div>
                <button
                  onClick={handleBackToSearch}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <FaTimes />
                  <span>Back to Search</span>
                </button>
              </div>

              {/* Results List */}
              {searchResults[searchType]?.length > 0 ? (
                <div className="space-y-4">
                  {searchResults[searchType].map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      {searchType === 'jobs' ? (
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xl font-semibold text-gray-800">
                              {item.title}
                            </h3>
                            <span className="text-lg font-bold text-green-600">
                              ${item.budget}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.skills?.slice(0, 5).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>{item.category}</span>
                              <span>{item.location}</span>
                              {item.isRemote && (
                                <span className="text-green-600">Remote</span>
                              )}
                            </div>
                            <span>
                              {item._count?.proposals || 0} proposals
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-semibold">
                                  {item.firstName?.[0]}{item.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-gray-800">
                                  {item.firstName} {item.lastName}
                                </h3>
                                <p className="text-gray-600">
                                  {item.profile?.title}
                                </p>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              ${item.profile?.hourlyRate}/hr
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.profile?.skills?.slice(0, 5).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>{item.profile?.experience} years experience</span>
                              <span>{item.profile?.availability}</span>
                            </div>
                            <span>
                              {item._count?.proposals || 0} proposals
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaSearch className="mx-auto text-6xl text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {t('search.noResults')}
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              )}

              {/* Pagination */}
              {searchResults.pagination && searchResults.pagination.pages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    <button
                      disabled={searchResults.pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 border border-gray-300 rounded-md bg-blue-50">
                      {searchResults.pagination.page} of {searchResults.pagination.pages}
                    </span>
                    <button
                      disabled={searchResults.pagination.page === searchResults.pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchPage;


