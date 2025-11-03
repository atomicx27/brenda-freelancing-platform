import React, { useState } from 'react';
import { FaMagic, FaSpinner, FaUndo, FaCheck } from 'react-icons/fa';

/**
 * AIEnhanceButton Component
 * Reusable button component for AI-powered text enhancement
 * 
 * @param {string} originalText - The original text to enhance
 * @param {function} onEnhanced - Callback when text is enhanced
 * @param {function} enhanceFunction - API function to call for enhancement
 * @param {object} additionalData - Additional data to pass to the enhance function
 * @param {string} buttonText - Custom button text (default: "Enhance with AI")
 * @param {string} type - Type of enhancement ('job' or 'proposal')
 */
const AIEnhanceButton = ({
  originalText,
  onEnhanced,
  enhanceFunction,
  additionalData = {},
  buttonText = 'Enhance with AI',
  type = 'job',
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [error, setError] = useState(null);

  const handleEnhance = async () => {
    if (!originalText || !originalText.trim()) {
      setError('Please enter some text first');
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const result = await enhanceFunction({
        ...additionalData,
        [type === 'job' ? 'description' : 'proposal']: originalText,
      });

      if (result.data && result.data.enhanced) {
        onEnhanced(result.data.enhanced);
        setEnhanced(true);
        
        // Reset enhanced state after 3 seconds
        setTimeout(() => setEnhanced(false), 3000);
      } else {
        throw new Error('No enhanced text received');
      }
    } catch (err) {
      console.error('Enhancement error:', err);
      setError(err.message || 'Failed to enhance text. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleEnhance}
        disabled={isEnhancing || !originalText}
        className={`
          flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
          font-medium transition-all duration-200
          ${
            isEnhancing || !originalText
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : enhanced
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-md hover:shadow-lg'
          }
        `}
      >
        {isEnhancing ? (
          <>
            <FaSpinner className="animate-spin" />
            <span>Enhancing...</span>
          </>
        ) : enhanced ? (
          <>
            <FaCheck />
            <span>Enhanced!</span>
          </>
        ) : (
          <>
            <FaMagic />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {error && (
        <div className="text-red-500 text-sm flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {enhanced && (
        <div className="text-green-600 text-sm flex items-center gap-2">
          <FaCheck />
          <span>Text has been enhanced with AI</span>
        </div>
      )}
    </div>
  );
};

/**
 * AIAnalysisPanel Component
 * Displays AI analysis results for proposals
 */
export const AIAnalysisPanel = ({ analysis }) => {
  if (!analysis) return null;

  const { score, strengths, improvements, overallFeedback } = analysis;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FaMagic className="text-purple-500" />
        AI Analysis
      </h3>

      {/* Score */}
      <div className="flex items-center gap-4">
        <div className={`${getScoreBackground(score)} rounded-full px-4 py-2`}>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}/100
          </span>
        </div>
        <p className="text-gray-600">{overallFeedback}</p>
      </div>

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div>
          <h4 className="font-semibold text-green-700 mb-2">✅ Strengths</h4>
          <ul className="space-y-1">
            {strengths.map((strength, index) => (
              <li key={index} className="text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {improvements && improvements.length > 0 && (
        <div>
          <h4 className="font-semibold text-orange-700 mb-2">💡 Improvements</h4>
          <ul className="space-y-1">
            {improvements.map((improvement, index) => (
              <li key={index} className="text-gray-700 flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * AIComparisonModal Component
 * Shows before/after comparison of AI-enhanced text
 */
export const AIComparisonModal = ({ original, enhanced, onAccept, onReject, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaMagic />
            AI Enhancement Comparison
          </h2>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaUndo className="text-gray-500" />
                Original
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[200px]">
                <p className="text-gray-700 whitespace-pre-wrap">{original}</p>
              </div>
            </div>

            {/* Enhanced */}
            <div>
              <h3 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <FaMagic className="text-purple-500" />
                AI Enhanced
              </h3>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 min-h-[200px]">
                <p className="text-gray-800 whitespace-pre-wrap">{enhanced}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onReject}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Keep Original
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-colors shadow-md"
          >
            Use AI Version
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIEnhanceButton;
