import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FaGlobe, FaChevronDown, FaCheck } from 'react-icons/fa';

const LanguageSwitcher = ({ 
  showLabel = true, 
  size = 'default',
  position = 'bottom-right' 
}) => {
  const { currentLanguage, changeLanguage, t, getAvailableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const availableLanguages = getAvailableLanguages();

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm px-2 py-1';
      case 'large':
        return 'text-lg px-4 py-3';
      default:
        return 'text-base px-3 py-2';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'left-0';
      case 'top-right':
        return 'right-0 top-0 transform -translate-y-full';
      case 'top-left':
        return 'left-0 top-0 transform -translate-y-full';
      default:
        return 'right-0';
    }
  };

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 ${getSizeClasses()} bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
      >
        <FaGlobe className="text-gray-600" />
        {showLabel && (
          <span className="text-gray-700 font-medium">
            {currentLang?.flag} {currentLang?.name}
          </span>
        )}
        <FaChevronDown className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute z-20 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg ${getPositionClasses()}`}>
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">
                  {t('language.selectLanguage')}
                </h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {availableLanguages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => {
                      changeLanguage(language.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      currentLanguage === language.code ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{language.flag}</span>
                      <span className="text-gray-700 font-medium">
                        {language.name}
                      </span>
                    </div>
                    
                    {currentLanguage === language.code && (
                      <FaCheck className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;


